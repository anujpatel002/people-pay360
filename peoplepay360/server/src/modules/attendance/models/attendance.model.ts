import { RowDataPacket } from 'mysql2';

export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'Absent'
  | 'Overtime'
  | 'Missing Check-Out'
  | 'Corrected';

export interface AttendanceRow extends RowDataPacket {
  id: string;
  employee_id: string;
  schedule_id: string | null;
  date: string | Date;
  check_in: Date | string;
  check_out: Date | string | null;
  worked_minutes: number | null;
  overtime_minutes: number;
  scheduled_minutes: number | null;
  break_minutes: number;
  status: AttendanceStatus;
  is_manual_entry: number;
  correction_reason: string | null;
  corrected_by: string | null;
  corrected_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  // joined fields
  employee_name?: string;
  employee_number?: string;
  schedule_name?: string;
  corrector_name?: string;
}

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

function formatDateOnly(d: string | Date): string {
  if (typeof d === 'string') {
    return d.slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

function formatIso(d: Date | string | null): string | null {
  if (!d) return null;
  if (typeof d === 'string') {
    // If it's already an ISO string or MySQL datetime 'YYYY-MM-DD HH:MM:SS'
    if (d.includes('T')) return d;
    return new Date(d.replace(' ', 'T') + 'Z').toISOString();
  }
  return d.toISOString();
}

export function toAttendance(row: AttendanceRow): Attendance {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeNumber: row.employee_number,
    scheduleId: row.schedule_id ?? null,
    scheduleName: row.schedule_name,
    date: formatDateOnly(row.date),
    checkIn: formatIso(row.check_in)!,
    checkOut: formatIso(row.check_out),
    workedMinutes: row.worked_minutes !== null ? Number(row.worked_minutes) : null,
    overtimeMinutes: Number(row.overtime_minutes ?? 0),
    scheduledMinutes: row.scheduled_minutes !== null ? Number(row.scheduled_minutes) : null,
    breakMinutes: Number(row.break_minutes ?? 0),
    status: row.status,
    isManualEntry: Boolean(row.is_manual_entry),
    correctionReason: row.correction_reason ?? null,
    correctedBy: row.corrected_by ?? null,
    correctorName: row.corrector_name,
    correctedAt: formatIso(row.corrected_at),
    createdAt: formatIso(row.created_at)!,
    updatedAt: formatIso(row.updated_at)!,
  };
}
