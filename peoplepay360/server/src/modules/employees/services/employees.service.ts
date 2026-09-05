import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import * as repo from '../repositories/employees.repository';
import { Employee, EmployeeFilters, SmartCounts } from '../types/employee.types';
import { PaginatedResult } from '../../../shared/types';
import { ValidationError, NotFoundError, AppError } from '../../../shared/errors/AppError';

export async function getEmployees(filters: EmployeeFilters): Promise<PaginatedResult<Employee>> {
  return repo.findAll(filters);
}

export async function getEmployee(id: string): Promise<Employee> {
  const emp = await repo.findById(id);
  if (!emp) throw new NotFoundError('Employee not found');
  return emp;
}

export async function getSmartCounts(id: string): Promise<SmartCounts> {
  await getEmployee(id);
  return repo.countRelated(id);
}

export async function createEmployee(data: Record<string, unknown>, actorId: string): Promise<Employee> {
  await validateEmail(data.workEmail as string, null);
  if (data.managerId) await validateManager(data.managerId as string, null);
  return repo.create({ ...data, createdBy: actorId });
}

export async function updateEmployee(id: string, data: Record<string, unknown>, actorId: string): Promise<Employee> {
  const existing = await getEmployee(id);
  if (existing.status === 'archived') throw new ValidationError('Cannot update an archived employee');

  if (data.workEmail && (data.workEmail as string).toLowerCase() !== existing.workEmail) {
    await validateEmail(data.workEmail as string, id);
  }
  if (data.managerId !== undefined) {
    await validateManager(data.managerId as string | null, id);
  }

  return repo.update(id, { ...data, updatedBy: actorId });
}

export async function archiveEmployee(id: string, actorId: string): Promise<void> {
  await getEmployee(id);
  await checkOpenPayrun(id);
  await repo.softArchive(id, actorId);
}

export async function restoreEmployee(id: string): Promise<Employee> {
  const emp = await getEmployee(id);
  if (emp.status === 'active') throw new ValidationError('Employee is already active');
  await repo.restore(id);
  return getEmployee(id);
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function validateEmail(email: string, excludeId: string | null): Promise<void> {
  const existing = await repo.findByEmail(email.toLowerCase().trim());
  if (existing && existing.id !== excludeId) {
    throw new ValidationError('Email address is already in use');
  }
}

async function validateManager(managerId: string | null, employeeId: string | null): Promise<void> {
  if (!managerId) return;
  if (managerId === employeeId) throw new ValidationError('Employee cannot be their own manager');

  const manager = await repo.findById(managerId);
  if (!manager) throw new ValidationError('Manager not found');
  if (manager.status === 'archived') throw new ValidationError('Manager must be an active employee');

  if (employeeId) await detectCycle(employeeId, managerId);
}

async function detectCycle(employeeId: string, managerId: string): Promise<void> {
  let current: string | undefined = managerId;
  const visited = new Set<string>();

  while (current) {
    if (current === employeeId) throw new ValidationError('Manager assignment creates a hierarchy cycle');
    if (visited.has(current)) break;
    visited.add(current);
    const emp = await repo.findById(current);
    current = emp?.managerId;
  }
}

async function checkOpenPayrun(employeeId: string): Promise<void> {
  const [[row]] = await pool.execute<(RowDataPacket & { cnt: number })[]>(
    `SELECT COUNT(*) AS cnt FROM payslips p
     JOIN payruns pr ON pr.id = p.payrun_id
     WHERE p.employee_id = ? AND pr.status NOT IN ('Paid')`,
    [employeeId]
  );

  if (row.cnt > 0) {
    throw new AppError(409, 'Employee is referenced by an open payrun');
  }
}
