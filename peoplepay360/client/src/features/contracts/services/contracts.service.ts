import httpClient from '@/shared/services/httpClient';
import { Contract, ContractFormValues, ContractLookups } from '../types/contract.types';
import { PaginatedResult } from '@/shared/types/api.types';

export interface ContractFilters {
  employeeId?: string;
  search?: string;
  status?: string;
  department?: string;
  companyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function getContracts(filters: ContractFilters = {}): Promise<PaginatedResult<Contract>> {
  const { data } = await httpClient.get<PaginatedResult<Contract>>('/contracts', { params: filters });
  return data;
}

export async function getContractLookups(): Promise<ContractLookups> {
  const { data } = await httpClient.get<ContractLookups>('/contracts/lookups');
  return data;
}

export async function getContract(id: string): Promise<Contract> {
  const { data } = await httpClient.get<Contract>(`/contracts/${id}`);
  return data;
}

export async function getActiveContract(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<Contract> {
  const { data } = await httpClient.get<Contract>('/contracts/active', {
    params: { employeeId, periodStart, periodEnd },
  });
  return data;
}

export async function createContract(payload: ContractFormValues): Promise<Contract> {
  const { data } = await httpClient.post<Contract>('/contracts', payload);
  return data;
}

export async function updateContract(id: string, payload: Partial<ContractFormValues>): Promise<Contract> {
  const { data } = await httpClient.put<Contract>(`/contracts/${id}`, payload);
  return data;
}
