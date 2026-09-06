import { hashPassword } from '../../auth/services/password.service';
import * as repo from '../repositories/users.repository';
import { CreateUserInput, UpdateUserInput } from '../validators/users.validator';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../shared/errors/AppError';
import { AuthUser } from '../../../shared/types';

export interface UserDTO {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  workEmail: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toDTO(row: repo.UserRow): UserDTO {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    name: row.name,
    workEmail: row.work_email,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUsers(filters: {
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const { rows, total } = await repo.findAll({ ...filters, page, limit });
  return { data: rows.map(toDTO), total, page, limit };
}

export async function getUser(id: string): Promise<UserDTO> {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError('User not found');
  return toDTO(row);
}

export async function createUser(input: CreateUserInput): Promise<UserDTO> {
  const existing = await repo.findByEmail(input.workEmail);
  if (existing) throw new ValidationError('Email already in use');

  const emp = await repo.resolveEmployee(input.employeeId);
  if (!emp) throw new ValidationError('employeeId does not reference an active employee');

  const alreadyLinked = await repo.findByEmployeeId(emp.id);
  if (alreadyLinked) throw new ValidationError('This employee already has a user account');

  const passwordHash = await hashPassword(input.password);
  const id = await repo.create({
    name: input.name,
    workEmail: input.workEmail,
    passwordHash,
    role: input.role,
    employeeId: emp.id,
  });

  const row = await repo.findById(id);
  return toDTO(row!);
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  requestingUser: AuthUser
): Promise<UserDTO> {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('User not found');

  // Self-elevation prevention
  if (requestingUser.id === id && input.role && input.role !== existing.role) {
    throw new ForbiddenError('Cannot elevate own role');
  }

  // Admin deactivation guard
  if (input.isActive === false && existing.role === 'Admin') {
    throw new ForbiddenError('System Administrator accounts are protected and cannot be deactivated');
  }

  await repo.update(id, {
    name: input.name,
    role: input.role,
    isActive: existing.role === 'Admin' ? true : input.isActive,
  });

  const updated = await repo.findById(id);
  return toDTO(updated!);
}

export async function deactivateUser(id: string, requestingUser: AuthUser): Promise<void> {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('User not found');

  if (requestingUser.id === id) throw new ForbiddenError('Cannot deactivate own account');

  if (existing.role === 'Admin') {
    throw new ForbiddenError('System Administrator accounts are protected and cannot be deactivated');
  }

  await repo.update(id, { isActive: false });
}
