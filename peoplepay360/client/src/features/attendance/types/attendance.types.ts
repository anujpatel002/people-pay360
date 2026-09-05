export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'Absent'
  | 'Overtime'
  | 'Missing Check-Out'
  | 'Corrected';

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  scheduleId: string | null;
  scheduleName?: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  workedMinutes: number | null;
  overtimeMinutes: number;
  scheduledMinutes?: number | null;
  breakMinutes?: number;
  status: AttendanceStatus;
  isManualEntry: boolean;
  correctionReason: string | null;
  correctedBy: string | null;
  correctorName?: string;
  correctedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  originalCheckIn: string;
  originalCheckOut: string | null;
  originalWorkedMinutes: number | null;
  originalOvertimeMinutes: number;
  originalStatus: AttendanceStatus;
  correctedCheckIn: string;
  correctedCheckOut: string | null;
  correctedWorkedMinutes: number | null;
  correctedOvertimeMinutes: number;
  correctedStatus: AttendanceStatus;
  correctionReason: string;
  correctedBy: string;
  correctorName?: string;
  correctedAt: string;
  createdAt: string;
}

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

export interface CorrectionPayload {
  checkIn: string;
  checkOut?: string | null;
  correctionReason: string;
}
