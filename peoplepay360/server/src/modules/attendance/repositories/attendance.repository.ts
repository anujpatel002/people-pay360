import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';
import { AttendanceRow, toAttendance, Attendance, AttendanceStatus } from '../models/attendance.model';
import { AttendanceFilters } from '../types/attendance.types';
import { PaginatedResult } from '../../../shared/types';

function toMysqlDatetime(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return null;
  }
}

const BASE_SELECT = `
  SELECT
    a.*,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    e.employee_number AS employee_number,
    ws.name AS schedule_name,
    u.name AS corrector_name
  FROM attendance_records a
  JOIN employees e ON e.id = a.employee_id
  LEFT JOIN working_schedules ws ON ws.id = a.schedule_id
  LEFT JOIN users u ON u.id = a.corrected_by
`;

export async function findAll(filters: AttendanceFilters): Promise<PaginatedResult<Attendance>> {
  const {
    employeeId,
    dateFrom,
    dateTo,
    status,
    search,
    page = 1,
    limit: rawLimit = 20,
    sortBy = 'date',
    sortOrder = 'desc',
  } = filters;

  const limit = Math.min(Math.max(rawLimit, 1), 100);
  const offset = (Math.max(page, 1) - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (employeeId) {
    conditions.push('a.employee_id = ?');
    params.push(employeeId);
  }

  if (dateFrom) {
    conditions.push('a.date >= ?');
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push('a.date <= ?');
    params.push(dateTo);
  }

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(CONCAT(e.first_name, \' \', e.last_name) LIKE ? OR e.employee_number LIKE ? OR a.correction_reason LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM attendance_records a
     JOIN employees e ON e.id = a.employee_id
     ${where}`,
    params as any[]
  );
  const total = Number((countRows[0] as any)?.total ?? 0);

  const sortColumnMap: Record<string, string> = {
    date: 'a.date',
    checkIn: 'a.check_in',
    workedMinutes: 'a.worked_minutes',
    overtimeMinutes: 'a.overtime_minutes',
    employeeName: 'employee_name',
    status: 'a.status',
  };
  const sortCol = sortColumnMap[sortBy] ?? 'a.date';
  const sortDir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const [rows] = await pool.execute<AttendanceRow[]>(
    `${BASE_SELECT} ${where} ORDER BY ${sortCol} ${sortDir}, a.check_in ${sortDir} LIMIT ? OFFSET ?`,
    [...params, limit, offset] as any[]
  );

  return {
    data: rows.map(toAttendance),
    total,
    page,
    limit,
  };
}

export async function findById(id: string): Promise<Attendance | null> {
  const [rows] = await pool.execute<AttendanceRow[]>(
    `${BASE_SELECT} WHERE a.id = ?`,
    [id] as any[]
  );
  return rows[0] ? toAttendance(rows[0]) : null;
}

export async function findOpenSession(employeeId: string): Promise<Attendance | null> {
  const [rows] = await pool.execute<AttendanceRow[]>(
    `${BASE_SELECT} WHERE a.employee_id = ? AND a.check_out IS NULL ORDER BY a.check_in DESC LIMIT 1`,
    [employeeId] as any[]
  );
  return rows[0] ? toAttendance(rows[0]) : null;
}

export async function findByEmployee(
  employeeId: string,
  filters?: Partial<AttendanceFilters>
): Promise<Attendance[]> {
  const result = await findAll({ ...filters, employeeId, limit: 1000 });
  return result.data;
}

export async function findByDateRange(
  dateFrom: string,
  dateTo: string,
  filters?: Partial<AttendanceFilters>
): Promise<Attendance[]> {
  const result = await findAll({ ...filters, dateFrom, dateTo, limit: 1000 });
  return result.data;
}

export async function findExceptions(filters?: Partial<AttendanceFilters>): Promise<Attendance[]> {
  const conditions: string[] = ["a.status IN ('Late', 'Overtime', 'Missing Check-Out', 'Absent')"];
  const params: unknown[] = [];

  if (filters?.employeeId) {
    conditions.push('a.employee_id = ?');
    params.push(filters.employeeId);
  }
  if (filters?.dateFrom) {
    conditions.push('a.date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    conditions.push('a.date <= ?');
    params.push(filters.dateTo);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [rows] = await pool.execute<AttendanceRow[]>(
    `${BASE_SELECT} ${where} ORDER BY a.date DESC, a.check_in DESC`,
    params as any[]
  );
  return rows.map(toAttendance);
}

export async function create(data: {
  id?: string;
  employeeId: string;
  scheduleId?: string | null;
  date: string;
  checkIn: Date | string;
  checkOut?: Date | string | null;
  workedMinutes?: number | null;
  overtimeMinutes?: number;
  scheduledMinutes?: number | null;
  breakMinutes?: number;
  status: AttendanceStatus;
  isManualEntry?: boolean;
  correctionReason?: string | null;
  correctedBy?: string | null;
  correctedAt?: Date | string | null;
}): Promise<Attendance> {
  const id = data.id ?? crypto.randomUUID();

  await pool.execute<ResultSetHeader>(
    `INSERT INTO attendance_records
      (id, employee_id, schedule_id, date, check_in, check_out,
       worked_minutes, overtime_minutes, scheduled_minutes, break_minutes,
       status, is_manual_entry, correction_reason, corrected_by, corrected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.employeeId,
      data.scheduleId ?? null,
      data.date,
      toMysqlDatetime(data.checkIn),
      toMysqlDatetime(data.checkOut ?? null),
      data.workedMinutes ?? null,
      data.overtimeMinutes ?? 0,
      data.scheduledMinutes ?? null,
      data.breakMinutes ?? 0,
      data.status,
      data.isManualEntry ? 1 : 0,
      data.correctionReason ?? null,
      data.correctedBy ?? null,
      toMysqlDatetime(data.correctedAt ?? null),
    ] as any[]
  );

  return (await findById(id))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<Attendance> {
  const fieldMap: Record<string, string> = {
    scheduleId: 'schedule_id',
    date: 'date',
    checkIn: 'check_in',
    checkOut: 'check_out',
    workedMinutes: 'worked_minutes',
    overtimeMinutes: 'overtime_minutes',
    scheduledMinutes: 'scheduled_minutes',
    breakMinutes: 'break_minutes',
    status: 'status',
    isManualEntry: 'is_manual_entry',
    correctionReason: 'correction_reason',
    correctedBy: 'corrected_by',
    correctedAt: 'corrected_at',
  };

  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) {
      sets.push(`${col} = ?`);
      let val = data[key];
      if (typeof val === 'boolean') val = val ? 1 : 0;
      // Convert Date/ISO string to MySQL DATETIME format
      if (val instanceof Date) val = toMysqlDatetime(val);
      else if (typeof val === 'string' && ['checkIn','checkOut','correctedAt'].includes(key)) val = toMysqlDatetime(val);
      params.push(val ?? null);
    }
  }

  if (!sets.length) return (await findById(id))!;

  params.push(id);
  await pool.execute<ResultSetHeader>(
    `UPDATE attendance_records SET ${sets.join(', ')} WHERE id = ?`,
    params as any[]
  );

  return (await findById(id))!;
}
