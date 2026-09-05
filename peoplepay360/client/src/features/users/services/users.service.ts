import httpClient from '@/shared/services/httpClient';
import { PaginatedResult } from '@/shared/types/api.types';
import { User, CreateUserPayload, UpdateUserPayload, UsersFilters } from '../types';

export async function fetchUsers(filters: UsersFilters = {}): Promise<PaginatedResult<User>> {
  const { data } = await httpClient.get<PaginatedResult<User>>('/users', { params: filters });
  return data;
}

export async function fetchUser(id: string): Promise<User> {
  const { data } = await httpClient.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await httpClient.post<User>('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await httpClient.put<User>(`/users/${id}`, payload);
  return data;
}

export async function deactivateUser(id: string): Promise<void> {
  await httpClient.delete(`/users/${id}`);
}
