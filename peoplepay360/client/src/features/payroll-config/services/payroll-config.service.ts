import httpClient from '@/shared/services/httpClient';
import { SalaryStructure, SalaryStructureDetail, SalaryRule, StructureFormValues, RuleFormValues } from '../types';

const BASE = '/payroll-config';

export async function getStructures(params: { search?: string; isActive?: boolean } = {}) {
  const { data } = await httpClient.get<{ data: SalaryStructure[]; total: number }>(`${BASE}/structures`, { params });
  return data;
}

export async function getStructure(id: string) {
  const { data } = await httpClient.get<SalaryStructureDetail>(`${BASE}/structures/${id}`);
  return data;
}

export async function createStructure(values: StructureFormValues) {
  const { data } = await httpClient.post<SalaryStructure>(`${BASE}/structures`, values);
  return data;
}

export async function updateStructure(id: string, values: Partial<StructureFormValues>) {
  const { data } = await httpClient.put<SalaryStructure>(`${BASE}/structures/${id}`, values);
  return data;
}

export async function deleteStructure(id: string) {
  await httpClient.delete(`${BASE}/structures/${id}`);
}

export async function getRules(structureId: string) {
  const { data } = await httpClient.get<{ data: SalaryRule[]; total: number }>(`${BASE}/rules`, { params: { structureId } });
  return data;
}

export async function createRule(values: RuleFormValues) {
  const { data } = await httpClient.post<SalaryRule>(`${BASE}/rules`, values);
  return data;
}

export async function updateRule(id: string, values: Partial<RuleFormValues>) {
  const { data } = await httpClient.put<SalaryRule>(`${BASE}/rules/${id}`, values);
  return data;
}

export async function deleteRule(id: string) {
  await httpClient.delete(`${BASE}/rules/${id}`);
}
