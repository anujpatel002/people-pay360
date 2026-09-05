import { ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';
import {
  AttendanceCorrectionRow,
  toAttendanceCorrection,
  AttendanceCorrection,
} from '../models/attendance-correction.model';

const BASE_SELECT = `
  SELECT
    c.*,
    u.name AS corrector_name
  FROM attendance_corrections c
  LEFT JOIN users u ON u.id = c.corrected_by
`;

export async function create(data: {
  id?: string;
  attendanceId: string;
  originalCheckIn: string | Date;
  originalCheckOut: string | Date | null;
  originalWorkedMinutes: number | null;
  originalOvertimeMinutes: number;
  originalStatus: string;
  correctedCheckIn: string | Date;
  correctedCheckOut: string | Date | null;
  correctedWorkedMinutes: number | null;
  correctedOvertimeMinutes: number;
  correctedStatus: string;
  correctionReason: string;
  correctedBy: string;
  correctedAt?: string | Date;
}): Promise<AttendanceCorrection> {
  const id = data.id ?? crypto.randomUUID();
  const correctedAt = data.correctedAt ?? new Date();

  await pool.execute<ResultSetHeader>(
    `INSERT INTO attendance_corrections
      (id, attendance_id,
       original_check_in, original_check_out, original_worked_minutes, original_overtime_minutes, original_status,
       corrected_check_in, corrected_check_out, corrected_worked_minutes, corrected_overtime_minutes, corrected_status,
       correction_reason, corrected_by, corrected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.attendanceId,
      data.originalCheckIn,
      data.originalCheckOut ?? null,
      data.originalWorkedMinutes ?? null,
      data.originalOvertimeMinutes ?? 0,
      data.originalStatus,
      data.correctedCheckIn,
      data.correctedCheckOut ?? null,
      data.correctedWorkedMinutes ?? null,
      data.correctedOvertimeMinutes ?? 0,
      data.correctedStatus,
      data.correctionReason,
      data.correctedBy,
      correctedAt,
    ] as any[]
  );

  const [rows] = await pool.execute<AttendanceCorrectionRow[]>(
    `${BASE_SELECT} WHERE c.id = ?`,
    [id] as any[]
  );
  return toAttendanceCorrection(rows[0]);
}

export async function findByAttendanceId(attendanceId: string): Promise<AttendanceCorrection[]> {
  const [rows] = await pool.execute<AttendanceCorrectionRow[]>(
    `${BASE_SELECT} WHERE c.attendance_id = ? ORDER BY c.corrected_at DESC`,
    [attendanceId] as any[]
  );
  return rows.map(toAttendanceCorrection);
}
