import httpClient from '@/shared/services/httpClient';
import { WorkingSchedule, ScheduleFormValues } from '../types';

export async function getSchedules(params: { search?: string; isActive?: boolean } = {}): Promise<{ data: WorkingSchedule[]; total: number }> {
  const { data } = await httpClient.get<{ data: WorkingSchedule[]; total: number }>('/working-schedules', { params });
  return data;
}

export async function getSchedule(id: string): Promise<WorkingSchedule> {
  const { data } = await httpClient.get<WorkingSchedule>(`/working-schedules/${id}`);
  return data;
}

export async function createSchedule(values: ScheduleFormValues): Promise<WorkingSchedule> {
  const { data } = await httpClient.post<WorkingSchedule>('/working-schedules', values);
  return data;
}

export async function updateSchedule(id: string, values: Partial<ScheduleFormValues>): Promise<WorkingSchedule> {
  const { data } = await httpClient.put<WorkingSchedule>(`/working-schedules/${id}`, values);
  return data;
}

export async function deleteSchedule(id: string): Promise<void> {
  await httpClient.delete(`/working-schedules/${id}`);
}
