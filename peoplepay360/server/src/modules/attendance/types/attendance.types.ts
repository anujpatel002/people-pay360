import { AttendanceStatus } from '../models/attendance.model';

export interface AttendanceFilters {
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceStatus | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'checkIn' | 'workedMinutes' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CorrectAttendanceDTO {
  checkIn: string;
  checkOut?: string | null;
  correctionReason: string;
}

export interface DayScheduleConfig {
  day: string;
  active: boolean;
  start: string;       // e.g. '09:00'
  end: string;         // e.g. '18:00'
  breakMinutes: number;// e.g. 60
}
