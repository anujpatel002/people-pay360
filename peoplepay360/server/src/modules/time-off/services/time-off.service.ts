import pool from '../../../database/connection/pool';
import * as repo from '../repositories/time-off.repository';
import { deductBalance, restoreBalance } from './allocation-balance.service';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../shared/errors/AppError';
import {
  CreateTypeInput, UpdateTypeInput,
  CreateAllocationInput, UpdateAllocationInput,
  CreateRequestInput, RefuseRequestInput,
} from '../validators/time-off.validator';
import { TimeOffType, Allocation, TimeOffRequest } from '../models/time-off.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export async function listTypes(onlyActive?: boolean): Promise<{ data: TimeOffType[]; total: number }> {
  const data = await repo.findAllTypes(onlyActive);
  return { data, total: data.length };
}

export async function getType(id: string): Promise<TimeOffType> {
  const type = await repo.findTypeById(id);
  if (!type) throw new NotFoundError('Time off type not found');
  return type;
}

export async function createType(input: CreateTypeInput): Promise<TimeOffType> {
  return repo.createType({
    name: input.name, unit: input.unit,
    allocationRequired: input.allocationRequired ?? true,
    approvalMode: input.approvalMode ?? 'time_off',
    isPaid: input.isPaid ?? true,
    workEntry: input.workEntry, color: input.color, notes: input.notes,
  });
}

export async function updateType(id: string, input: UpdateTypeInput): Promise<TimeOffType> {
  const existing = await repo.findTypeById(id);
  if (!existing) throw new NotFoundError('Time off type not found');
  return repo.updateType(id, input as Record<string, unknown>);
}

// ─── Allocations ──────────────────────────────────────────────────────────────

export async function listAllocations(filters: {
  employeeId?: string; typeId?: string; year?: number; page?: number; limit?: number;
}) {
  return repo.findAllocations(filters);
}

export async function getAllocation(id: string): Promise<Allocation> {
  const alloc = await repo.findAllocationById(id);
  if (!alloc) throw new NotFoundError('Allocation not found');
  return alloc;
}

export async function createAllocation(input: CreateAllocationInput, approverId: string): Promise<Allocation> {
  const [empRows] = await pool.execute<any[]>(
    `SELECT id FROM employees WHERE (id = ? OR employee_number = ?) LIMIT 1`,
    [input.employeeId, input.employeeId]
  );
  const employeeId = empRows[0]?.id || input.employeeId;

  const existing = await repo.findAllocationForBalance(employeeId, input.typeId, input.year);
  if (existing) throw new ValidationError('Allocation already exists for this employee, type, and year');
  return repo.createAllocation({ ...input, employeeId, approverId });
}

export async function updateAllocation(id: string, input: UpdateAllocationInput): Promise<Allocation> {
  const existing = await repo.findAllocationById(id);
  if (!existing) throw new NotFoundError('Allocation not found');
  return repo.updateAllocation(id, input as Record<string, unknown>);
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function listRequests(filters: {
  employeeId?: string; typeId?: string; status?: string;
  dateFrom?: string; dateTo?: string; page?: number; limit?: number;
  requestingEmployeeId?: string; isHR?: boolean;
}) {
  const { requestingEmployeeId, isHR, ...rest } = filters;
  // Employees can only see their own requests
  if (!isHR && requestingEmployeeId) rest.employeeId = requestingEmployeeId;
  return repo.findRequests(rest);
}

export async function getRequest(id: string, requestingEmployeeId: string, isHR: boolean): Promise<TimeOffRequest> {
  const req = await repo.findRequestById(id);
  if (!req) throw new NotFoundError('Request not found');
  if (!isHR && req.employeeId !== requestingEmployeeId) throw new ForbiddenError();
  return req;
}

export async function createRequest(
  input: CreateRequestInput,
  employeeId: string
): Promise<TimeOffRequest> {
  const type = await repo.findTypeById(input.typeId);
  if (!type) throw new NotFoundError('Time off type not found');

  const overlapping = await repo.findOverlappingRequests(
    employeeId,
    input.startDate,
    input.endDate
  );
  if (overlapping.length > 0) {
    throw new ValidationError(
      `A time off request already exists for an overlapping date: ${overlapping[0].startDate}`
    );
  }

  let allocationId: string | null = null;

  if (type.allocationRequired) {
    const year = new Date(input.startDate).getFullYear();
    const alloc = await repo.findAllocationForBalance(employeeId, input.typeId, year);
    if (!alloc) throw new ValidationError('No approved allocation found for this leave type');

    const remaining = alloc.totalDays - alloc.usedDays;
    if (input.days > remaining) {
      throw new ValidationError(
        `Insufficient leave balance. Available: ${remaining} days, Requested: ${input.days} days`
      );
    }
    allocationId = alloc.id;
  }

  return repo.createRequest({ ...input, employeeId, allocationId });
}

export async function approveRequest(id: string): Promise<TimeOffRequest> {
  const req = await repo.findRequestById(id);
  if (!req) throw new NotFoundError('Request not found');
  if (!['Confirmed', 'Draft'].includes(req.status)) throw new ValidationError('Only Confirmed or Draft requests can be approved');

  if (req.allocationId) await deductBalance(req.allocationId, req.days);

  return repo.updateRequest(id, { status: 'Approved' });
}

export async function refuseRequest(id: string, input: RefuseRequestInput): Promise<TimeOffRequest> {
  const req = await repo.findRequestById(id);
  if (!req) throw new NotFoundError('Request not found');
  if (!['Draft', 'Confirmed', 'Approved'].includes(req.status)) {
    throw new ValidationError('Only Draft, Confirmed, or Approved requests can be refused');
  }

  // Restore balance if was already approved
  if (req.status === 'Approved' && req.allocationId) {
    await restoreBalance(req.allocationId, req.days);
  }

  return repo.updateRequest(id, { status: 'Refused', refusalReason: input.refusalReason });
}

export async function cancelRequest(id: string, requestingEmployeeId: string, isHR: boolean): Promise<TimeOffRequest> {
  const req = await repo.findRequestById(id);
  if (!req) throw new NotFoundError('Request not found');
  if (!isHR && req.employeeId !== requestingEmployeeId) throw new ForbiddenError();
  if (!['Confirmed', 'Approved'].includes(req.status)) {
    throw new ValidationError('Only Confirmed or Approved requests can be cancelled');
  }

  if (req.status === 'Approved' && req.allocationId) {
    await restoreBalance(req.allocationId, req.days);
  }

  return repo.updateRequest(id, { status: 'Cancelled' });
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export async function getBalance(employeeId: string, requestingEmployeeId: string, isHR: boolean) {
  if (!isHR && employeeId !== requestingEmployeeId) throw new ForbiddenError();
  const balances = await repo.getBalances(employeeId);
  return { employeeId, balances };
}
