import httpClient from '@/shared/services/httpClient';
import { PaginatedResult } from '@/shared/types/api.types';
import {
  Attendance,
  AttendanceFilters,
  AttendanceCorrection,
  CorrectionPayload,
} from '../types/attendance.types';

export async function getAttendance(
  filters: AttendanceFilters = {}
): Promise<PaginatedResult<Attendance>> {
  const { data } = await httpClient.get<PaginatedResult<Attendance>>('/attendance', {
    params: filters,
  });
  return data;
}

export async function getAttendanceRecord(id: string): Promise<Attendance> {
  const { data } = await httpClient.get<Attendance>(`/attendance/${id}`);
  return data;
}

export async function getOpenSession(): Promise<Attendance | null> {
  const { data } = await httpClient.get<Attendance | null>('/attendance/open-session');
  return data;
}

export async function checkIn(): Promise<Attendance> {
  const { data } = await httpClient.post<Attendance>('/attendance/check-in');
  return data;
}

export async function checkOut(): Promise<Attendance> {
  const { data } = await httpClient.post<Attendance>('/attendance/check-out');
  return data;
}

export async function correctRecord(
  id: string,
  payload: CorrectionPayload
): Promise<Attendance> {
  const { data } = await httpClient.put<Attendance>(`/attendance/${id}/correct`, payload);
  return data;
}

export async function getCorrections(id: string): Promise<AttendanceCorrection[]> {
  const { data } = await httpClient.get<{ attendanceId: string; data: AttendanceCorrection[] }>(
    `/attendance/${id}/corrections`
  );
  return data.data;
}
