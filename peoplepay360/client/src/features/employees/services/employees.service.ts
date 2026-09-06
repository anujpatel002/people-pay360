import httpClient from '@/shared/services/httpClient';
import { PaginatedResult } from '@/shared/types/api.types';
import { Employee, EmployeeFilters, EmployeeFormValues, SmartCounts, EmployeeLookups } from '../types/employee.types';

export async function getEmployees(filters: EmployeeFilters = {}): Promise<PaginatedResult<Employee>> {
  const { data } = await httpClient.get<PaginatedResult<Employee>>('/employees', { params: filters });
  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data } = await httpClient.get<Employee>(`/employees/${id}`);
  return data;
}

export async function getEmployeeLookups(): Promise<EmployeeLookups> {
  const { data } = await httpClient.get<EmployeeLookups>('/employees/lookups');
  return data;
}

export async function getSmartCounts(id: string): Promise<SmartCounts> {
  const { data } = await httpClient.get<SmartCounts>(`/employees/${id}/smart-counts`);
  return data;
}

export async function createEmployee(values: EmployeeFormValues): Promise<Employee> {
  const { data } = await httpClient.post<Employee>('/employees', values);
  return data;
}

export async function updateEmployee(id: string, values: Partial<EmployeeFormValues>): Promise<Employee> {
  const { data } = await httpClient.put<Employee>(`/employees/${id}`, values);
  return data;
}

export async function archiveEmployee(id: string): Promise<void> {
  await httpClient.delete(`/employees/${id}`);
}

export async function restoreEmployee(id: string): Promise<Employee> {
  const { data } = await httpClient.post<Employee>(`/employees/${id}/restore`);
  return data;
}
