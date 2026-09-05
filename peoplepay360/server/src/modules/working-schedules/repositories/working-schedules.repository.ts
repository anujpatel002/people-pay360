import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';

export interface ScheduleRow extends RowDataPacket {
  id: string;
  name: string;
  company: string;
  timezone: string;
  weekly_hours: number;
  days: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export async function findAll(filters: { search?: string; isActive?: boolean }): Promise<ScheduleRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    conditions.push('(name LIKE ? OR company LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.isActive !== undefined) {
    conditions.push('is_active = ?');
    params.push(filters.isActive ? 1 : 0);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute<ScheduleRow[]>(
    `SELECT * FROM working_schedules ${where} ORDER BY name ASC`,
    params as any[]
  );
  return rows;
}

export async function findById(id: string): Promise<ScheduleRow | null> {
  const [rows] = await pool.execute<ScheduleRow[]>(
    'SELECT * FROM working_schedules WHERE id = ?', [id]
  );
  return rows[0] ?? null;
}

export async function findByNameAndCompany(name: string, company: string): Promise<ScheduleRow | null> {
  const [rows] = await pool.execute<ScheduleRow[]>(
    'SELECT id FROM working_schedules WHERE name = ? AND company = ?', [name, company]
  );
  return rows[0] ?? null;
}

export async function create(data: {
  name: string; company: string; timezone: string;
  weeklyHours: number; days: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO working_schedules (id, name, company, timezone, weekly_hours, days)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.company, data.timezone, data.weeklyHours, data.days]
  );
  return id;
}

export async function update(id: string, data: {
  name?: string; company?: string; timezone?: string;
  weeklyHours?: number; days?: string; isActive?: boolean;
}): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.name      !== undefined) { fields.push('name = ?');         params.push(data.name); }
  if (data.company   !== undefined) { fields.push('company = ?');      params.push(data.company); }
  if (data.timezone  !== undefined) { fields.push('timezone = ?');     params.push(data.timezone); }
  if (data.weeklyHours !== undefined) { fields.push('weekly_hours = ?'); params.push(data.weeklyHours); }
  if (data.days      !== undefined) { fields.push('days = ?');         params.push(data.days); }
  if (data.isActive  !== undefined) { fields.push('is_active = ?');    params.push(data.isActive ? 1 : 0); }

  if (!fields.length) return;
  params.push(id);
  await pool.execute(`UPDATE working_schedules SET ${fields.join(', ')} WHERE id = ?`, params as any[]);
}

export async function remove(id: string): Promise<void> {
  await pool.execute('DELETE FROM working_schedules WHERE id = ?', [id]);
}

export async function isReferenced(id: string): Promise<boolean> {
  const [[row]] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT (
       (SELECT COUNT(*) FROM employees WHERE schedule_id = ?) +
       (SELECT COUNT(*) FROM contracts  WHERE schedule_id = ?)
     ) AS total`,
    [id, id]
  );
  return row.total > 0;
}
