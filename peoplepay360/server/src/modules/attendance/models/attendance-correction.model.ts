import { RowDataPacket } from 'mysql2';
import { AttendanceStatus } from './attendance.model';

export interface AttendanceCorrectionRow extends RowDataPacket {
  id: string;
  attendance_id: string;
  original_check_in: Date | string;
  original_check_out: Date | string | null;
  original_worked_minutes: number | null;
  original_overtime_minutes: number;
  original_status: AttendanceStatus;
  corrected_check_in: Date | string;
  corrected_check_out: Date | string | null;
  corrected_worked_minutes: number | null;
  corrected_overtime_minutes: number;
  corrected_status: AttendanceStatus;
  correction_reason: string;
  corrected_by: string;
  corrected_at: Date | string;
  created_at: Date | string;
  corrector_name?: string;
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

function formatIso(d: Date | string | null): string | null {
  if (!d) return null;
  if (typeof d === 'string') {
    if (d.includes('T')) return d;
    return new Date(d.replace(' ', 'T') + 'Z').toISOString();
  }
  return d.toISOString();
}

export function toAttendanceCorrection(row: AttendanceCorrectionRow): AttendanceCorrection {
  return {
    id: row.id,
    attendanceId: row.attendance_id,
    originalCheckIn: formatIso(row.original_check_in)!,
    originalCheckOut: formatIso(row.original_check_out),
    originalWorkedMinutes: row.original_worked_minutes !== null ? Number(row.original_worked_minutes) : null,
    originalOvertimeMinutes: Number(row.original_overtime_minutes ?? 0),
    originalStatus: row.original_status,
    correctedCheckIn: formatIso(row.corrected_check_in)!,
    correctedCheckOut: formatIso(row.corrected_check_out),
    correctedWorkedMinutes: row.corrected_worked_minutes !== null ? Number(row.corrected_worked_minutes) : null,
    correctedOvertimeMinutes: Number(row.corrected_overtime_minutes ?? 0),
    correctedStatus: row.corrected_status,
    correctionReason: row.correction_reason,
    correctedBy: row.corrected_by,
    correctorName: row.corrector_name,
    correctedAt: formatIso(row.corrected_at)!,
    createdAt: formatIso(row.created_at)!,
  };
}
