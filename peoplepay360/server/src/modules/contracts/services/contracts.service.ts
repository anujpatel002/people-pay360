import * as repo from '../repositories/contracts.repository';
import { resolveActiveContract } from './active-contract.resolver';
import { Contract, ContractFilters } from '../models/contract.types';
import { PaginatedResult } from '../../../shared/types';
import { NotFoundError, AppError } from '../../../shared/errors/AppError';

export async function getContracts(filters: ContractFilters): Promise<PaginatedResult<Contract>> {
  return repo.findAll(filters);
}

export async function getContract(id: string): Promise<Contract> {
  const contract = await repo.findById(id);
  if (!contract) throw new NotFoundError('Contract not found');
  return contract;
}

export async function getActiveContract(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<Contract> {
  return resolveActiveContract(employeeId, periodStart, periodEnd);
}

export async function createContract(data: Record<string, unknown>): Promise<Contract> {
  if (data.status === 'Running') {
    await checkOverlap(
      data.employeeId as string,
      data.startDate as string,
      (data.endDate as string | null) ?? null
    );
  }
  return repo.create(data);
}

export async function updateContract(
  id: string,
  data: Record<string, unknown>
): Promise<Contract> {
  const existing = await getContract(id);

  const newStatus    = (data.status    ?? existing.status)    as string;
  const newStartDate = (data.startDate ?? existing.startDate) as string;
  const newEndDate   = ('endDate' in data ? data.endDate : existing.endDate) as string | null;

  if (newStatus === 'Running') {
    await checkOverlap(existing.employeeId, newStartDate, newEndDate, id);
  }

  return repo.update(id, data);
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function checkOverlap(
  employeeId: string,
  startDate: string,
  endDate: string | null,
  excludeId?: string
): Promise<void> {
  const overlapping = await repo.findOverlappingRunning(employeeId, startDate, endDate, excludeId);
  if (overlapping.length > 0) {
    throw new AppError(409, 'Employee already has an overlapping Running contract for this period');
  }
}
