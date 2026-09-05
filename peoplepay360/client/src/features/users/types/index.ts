import { UserRole } from '@/shared/types/api.types';

export interface User {
  id: string;
  employeeId: string;
  employeeName: string;
  name: string;
  workEmail: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  workEmail: string;
  password: string;
  role: UserRole;
  employeeId: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UsersFilters {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}
