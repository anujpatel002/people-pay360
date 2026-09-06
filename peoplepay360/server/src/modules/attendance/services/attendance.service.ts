import * as attendanceRepo from '../repositories/attendance.repository';
import * as correctionRepo from '../repositories/attendance-correction.repository';
import { resolveScheduleForEmployee } from './schedule-resolver.service';
import { calculateWorkedHours } from './worked-hours.service';
import { detectAttendanceStatus } from './exception-detector.service';
import { Attendance } from '../models/attendance.model';
import { AttendanceCorrection } from '../models/attendance-correction.model';
import { AttendanceFilters, CorrectAttendanceDTO } from '../types/attendance.types';
import { AuthUser, PaginatedResult } from '../../../shared/types';
import { AppError, NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';
import pool from '../../../database/connection/pool';
import { RowDataPacket } from 'mysql2';

export async function listAttendance(
  user: AuthUser,
  filters: AttendanceFilters
): Promise<PaginatedResult<Attendance>> {
  const queryFilters = { ...filters };

  // Strict ownership check: standard employee can only see their own attendance
  if (user.role === 'Employee') {
    queryFilters.employeeId = user.employeeId;
  }

  return attendanceRepo.findAll(queryFilters);
}

export async function getAttendanceRecord(user: AuthUser, id: string): Promise<Attendance> {
  const record = await attendanceRepo.findById(id);
  if (!record) {
    throw new NotFoundError('Attendance record not found');
  }

  if (user.role === 'Employee' && record.employeeId !== user.employeeId) {
    throw new ForbiddenError('Access denied to other employee attendance records');
  }

  return record;
}

export async function getOpenSession(user: AuthUser): Promise<Attendance | null> {
  if (!user.employeeId) {
    return null;
  }
  return attendanceRepo.findOpenSession(user.employeeId);
}

export async function checkIn(user: AuthUser): Promise<Attendance> {
  const employeeId = user.employeeId;
  if (!employeeId) {
    throw new AppError(400, 'No employee record linked to current user');
  }

  // 1. Verify active employee status
  const [empRows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, status, schedule_id FROM employees WHERE id = ?',
    [employeeId]
  );
  if (!empRows.length) {
    throw new NotFoundError('Employee not found');
  }
  if (empRows[0].status === 'archived') {
    throw new AppError(422, 'Archived employees cannot check in');
  }

  // 2. Prevent duplicate open sessions
  const existingOpen = await attendanceRepo.findOpenSession(employeeId);
  if (existingOpen) {
    throw new AppError(409, 'Employee already has an open check-in session');
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  // 3. Resolve schedule
  const resolved = await resolveScheduleForEmployee(employeeId, dateStr, empRows[0].schedule_id);

  // 4. Initial status detection
  const initialStatus = detectAttendanceStatus({
    checkIn: now,
    checkOut: null,
    dayConfig: resolved.dayConfig,
  });

  return attendanceRepo.create({
    employeeId,
    scheduleId: resolved.scheduleId,
    date: dateStr,
    checkIn: now,
    checkOut: null,
    workedMinutes: null,
    overtimeMinutes: 0,
    scheduledMinutes: resolved.expectedMinutes,
    breakMinutes: resolved.dayConfig?.breakMinutes ?? 0,
    status: initialStatus,
    isManualEntry: false,
  });
}

export async function checkOut(user: AuthUser): Promise<Attendance> {
  const employeeId = user.employeeId;
  if (!employeeId) {
    throw new AppError(400, 'No employee record linked to current user');
  }

  const openSession = await attendanceRepo.findOpenSession(employeeId);
  if (!openSession) {
    throw new AppError(404, 'No open check-in session found for this employee');
  }

  const checkOutTime = new Date();

  // Resolve schedule for session date
  const resolved = await resolveScheduleForEmployee(
    employeeId,
    openSession.date,
    openSession.scheduleId
  );

  // Compute worked hours and overtime
  const calculation = calculateWorkedHours({
    checkIn: openSession.checkIn,
    checkOut: checkOutTime,
    dayConfig: resolved.dayConfig,
    expectedMinutes: resolved.expectedMinutes,
  });

  // Detect status (Late / Overtime / Present)
  const status = detectAttendanceStatus({
    checkIn: openSession.checkIn,
    checkOut: checkOutTime,
    dayConfig: resolved.dayConfig,
    workedMinutes: calculation.workedMinutes,
    overtimeMinutes: calculation.overtimeMinutes,
    isManualEntry: openSession.isManualEntry,
  });

  return attendanceRepo.update(openSession.id, {
    checkOut: checkOutTime,
    workedMinutes: calculation.workedMinutes,
    overtimeMinutes: calculation.overtimeMinutes,
    scheduledMinutes: calculation.scheduledMinutes,
    breakMinutes: calculation.breakMinutes,
    status,
  });
}

export async function correctRecord(
  user: AuthUser,
  id: string,
  dto: CorrectAttendanceDTO
): Promise<Attendance> {
  if (user.role === 'Employee') {
    throw new ForbiddenError('Employees cannot correct attendance records');
  }

  if (!dto.correctionReason || dto.correctionReason.trim().length === 0) {
    throw new AppError(422, 'correctionReason is required');
  }

  const existing = await attendanceRepo.findById(id);
  if (!existing) {
    throw new NotFoundError('Attendance record not found');
  }

  const resolved = await resolveScheduleForEmployee(
    existing.employeeId,
    existing.date,
    existing.scheduleId
  );

  const calculation = calculateWorkedHours({
    checkIn: dto.checkIn,
    checkOut: dto.checkOut,
    dayConfig: resolved.dayConfig,
    expectedMinutes: resolved.expectedMinutes,
  });

  const now = new Date();

  // Create audit log record
  await correctionRepo.create({
    attendanceId: existing.id,
    originalCheckIn: existing.checkIn,
    originalCheckOut: existing.checkOut,
    originalWorkedMinutes: existing.workedMinutes,
    originalOvertimeMinutes: existing.overtimeMinutes,
    originalStatus: existing.status,
    correctedCheckIn: dto.checkIn,
    correctedCheckOut: dto.checkOut ?? null,
    correctedWorkedMinutes: calculation.workedMinutes,
    correctedOvertimeMinutes: calculation.overtimeMinutes,
    correctedStatus: 'Corrected',
    correctionReason: dto.correctionReason.trim(),
    correctedBy: user.id,
    correctedAt: now,
  });

  // Update attendance record with corrected data
  return attendanceRepo.update(existing.id, {
    checkIn: dto.checkIn,
    checkOut: dto.checkOut ?? null,
    workedMinutes: calculation.workedMinutes,
    overtimeMinutes: calculation.overtimeMinutes,
    scheduledMinutes: calculation.scheduledMinutes,
    breakMinutes: calculation.breakMinutes,
    status: 'Corrected',
    isManualEntry: true,
    correctionReason: dto.correctionReason.trim(),
    correctedBy: user.id,
    correctedAt: now,
  });
}

export async function getCorrections(
  user: AuthUser,
  id: string
): Promise<AttendanceCorrection[]> {
  // Ensure record exists and user has access
  await getAttendanceRecord(user, id);
  return correctionRepo.findByAttendanceId(id);
}

export interface BulkImportRow {
  employeeId: string;
  date: string;      // YYYY-MM-DD
  checkIn: string;   // HH:MM or full ISO
  checkOut?: string; // HH:MM or full ISO, optional
}

export async function bulkImport(
  user: AuthUser,
  rows: BulkImportRow[]
): Promise<{ created: number; failed: number; errors: { row: number; reason: string }[] }> {
  const errors: { row: number; reason: string }[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.employeeId || !row.date || !row.checkIn) {
        errors.push({ row: i + 1, reason: 'Missing required fields: employeeId, date, checkIn' });
        continue;
      }

      // Build full ISO timestamps
      const checkInFull = row.checkIn.includes('T') ? row.checkIn : `${row.date}T${row.checkIn}:00`;
      const checkOutFull = row.checkOut
        ? (row.checkOut.includes('T') ? row.checkOut : `${row.date}T${row.checkOut}:00`)
        : null;

      const schedule = await resolveScheduleForEmployee(row.employeeId, row.date);
      const calculation = await calculateWorkedHours(checkInFull, checkOutFull, schedule);
      const status = detectAttendanceStatus(calculation, schedule, checkInFull);

      await attendanceRepo.create({
        employeeId: row.employeeId,
        scheduleId: schedule?.id ?? null,
        date: row.date,
        checkIn: checkInFull,
        checkOut: checkOutFull,
        workedMinutes: calculation.workedMinutes,
        overtimeMinutes: calculation.overtimeMinutes,
        scheduledMinutes: calculation.scheduledMinutes ?? null,
        breakMinutes: calculation.breakMinutes ?? 0,
        status,
        isManualEntry: true,
        correctionReason: `Bulk import by ${user.email || user.id}`,
        correctedBy: user.id,
        correctedAt: new Date().toISOString(),
      });
      created++;
    } catch (err: any) {
      errors.push({ row: i + 1, reason: err?.message ?? 'Unknown error' });
    }
  }

  return { created, failed: errors.length, errors };
}
