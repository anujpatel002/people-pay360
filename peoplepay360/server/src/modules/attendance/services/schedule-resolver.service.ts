import pool from '../../../database/connection/pool';
import { RowDataPacket } from 'mysql2';
import { DayScheduleConfig } from '../types/attendance.types';

export interface ResolvedSchedule {
  scheduleId: string | null;
  scheduleName: string | null;
  dayConfig: DayScheduleConfig | null;
  expectedMinutes: number;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export async function resolveScheduleForEmployee(
  employeeId: string,
  dateStr: string,
  preferredScheduleId?: string | null
): Promise<ResolvedSchedule> {
  let scheduleId = preferredScheduleId ?? null;

  // 1. If not provided, try active running contract for the date
  if (!scheduleId) {
    const [contractRows] = await pool.execute<RowDataPacket[]>(
      `SELECT schedule_id FROM contracts
       WHERE employee_id = ?
         AND status = 'Running'
         AND start_date <= ?
         AND (end_date IS NULL OR end_date >= ?)
       ORDER BY start_date DESC LIMIT 1`,
      [employeeId, dateStr, dateStr]
    );
    if (contractRows[0]?.schedule_id) {
      scheduleId = contractRows[0].schedule_id;
    }
  }

  // 2. If still not resolved, fallback to employee's assigned schedule
  if (!scheduleId) {
    const [empRows] = await pool.execute<RowDataPacket[]>(
      'SELECT schedule_id FROM employees WHERE id = ?',
      [employeeId]
    );
    if (empRows[0]?.schedule_id) {
      scheduleId = empRows[0].schedule_id;
    }
  }

  if (!scheduleId) {
    return {
      scheduleId: null,
      scheduleName: null,
      dayConfig: null,
      expectedMinutes: 480, // standard default 8 hours fallback
    };
  }

  // Fetch schedule details
  const [scheduleRows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, days FROM working_schedules WHERE id = ?',
    [scheduleId]
  );

  if (!scheduleRows.length) {
    return {
      scheduleId: null,
      scheduleName: null,
      dayConfig: null,
      expectedMinutes: 480,
    };
  }

  const schedule = scheduleRows[0];
  let days: DayScheduleConfig[] = [];
  try {
    days = typeof schedule.days === 'string' ? JSON.parse(schedule.days) : schedule.days;
  } catch {
    days = [];
  }

  const targetDate = new Date(dateStr + 'T00:00:00Z');
  const dayName = DAY_NAMES[targetDate.getUTCDay()];

  const dayConfig = days.find(
    (d) => d.day?.toLowerCase() === dayName || d.day?.toLowerCase() === dayName.slice(0, 3)
  ) ?? null;

  let expectedMinutes = 0;
  if (dayConfig && dayConfig.active && dayConfig.start && dayConfig.end) {
    const [startH, startM] = dayConfig.start.split(':').map(Number);
    const [endH, endM] = dayConfig.end.split(':').map(Number);
    let spanMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (spanMinutes < 0) spanMinutes += 24 * 60; // overnight schedule
    const brk = Number(dayConfig.breakMinutes ?? 0);
    expectedMinutes = Math.max(0, spanMinutes - brk);
  }

  return {
    scheduleId: schedule.id,
    scheduleName: schedule.name,
    dayConfig,
    expectedMinutes,
  };
}
