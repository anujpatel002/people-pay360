import http from '@/shared/services/httpClient';
import { TimeOffType, Allocation, TimeOffRequest, BalanceResponse, PaginatedResult } from '../types';

export const getTypes = () =>
  http.get<{ data: TimeOffType[]; total: number }>('/time-off/types').then(r => r.data);

export const createType = (data: Partial<TimeOffType>) =>
  http.post<TimeOffType>('/time-off/types', data).then(r => r.data);

export const updateType = (id: string, data: Partial<TimeOffType>) =>
  http.put<TimeOffType>(`/time-off/types/${id}`, data).then(r => r.data);

export const getAllocations = (params?: Record<string, string | number>) =>
  http.get<PaginatedResult<Allocation>>('/time-off/allocations', { params }).then(r => r.data);

export const createAllocation = (data: Partial<Allocation>) =>
  http.post<Allocation>('/time-off/allocations', data).then(r => r.data);

export const updateAllocation = (id: string, data: Partial<Allocation>) =>
  http.put<Allocation>(`/time-off/allocations/${id}`, data).then(r => r.data);

export const getBalance = (employeeId: string) =>
  http.get<BalanceResponse>(`/time-off/balance/${employeeId}`).then(r => r.data);

export const getRequests = (params?: Record<string, string | number>) =>
  http.get<PaginatedResult<TimeOffRequest>>('/time-off/requests', { params }).then(r => r.data);

export const getRequest = (id: string) =>
  http.get<TimeOffRequest>(`/time-off/requests/${id}`).then(r => r.data);

export const createRequest = (data: { typeId: string; startDate: string; endDate: string; days: number; reason?: string }) =>
  http.post<TimeOffRequest>('/time-off/requests', data).then(r => r.data);

export const approveRequest = (id: string) =>
  http.put<TimeOffRequest>(`/time-off/requests/${id}/approve`).then(r => r.data);

export const refuseRequest = (id: string, refusalReason: string) =>
  http.put<TimeOffRequest>(`/time-off/requests/${id}/refuse`, { refusalReason }).then(r => r.data);

export const cancelRequest = (id: string) =>
  http.put<TimeOffRequest>(`/time-off/requests/${id}/cancel`).then(r => r.data);
