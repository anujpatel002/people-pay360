import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';
import { UserRole } from '../../../shared/types';

export interface UserRow extends RowDataPacket {
  id: string;
  employee_id: string;
  employee_name: string;
  name: string;
  work_email: string;
  role: UserRole;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserFilters {
  search?: string;
  role?: string;
  page: number;
  limit: number;
}

export async function findAll(filters: UserFilters): Promise<{ rows: UserRow[]; total: number }> {
  const { search, role, page, limit } = filters;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[]        = [];

  if (search) { conditions.push('(u.name LIKE ? OR u.work_email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (role)   { conditions.push('u.role = ?'); params.push(role); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM users u ${where}`, params
  );
  const total = (countRows[0] as RowDataPacket).total as number;

  const [rows] = await pool.execute<UserRow[]>(
    `SELECT u.id, u.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
            u.name, u.work_email, u.role, u.is_active, u.created_at, u.updated_at
     FROM users u
     JOIN employees e ON e.id = u.employee_id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total };
}

export async function findById(id: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT u.id, u.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
            u.name, u.work_email, u.role, u.is_active, u.created_at, u.updated_at
     FROM users u
     JOIN employees e ON e.id = u.employee_id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<UserRow[]>(
    'SELECT id, work_email FROM users WHERE work_email = ?', [email]
  );
  return rows[0] ?? null;
}

export async function findByEmployeeId(employeeId: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<UserRow[]>(
    'SELECT id FROM users WHERE employee_id = ?', [employeeId]
  );
  return rows[0] ?? null;
}

export async function create(data: {
  name: string; workEmail: string; passwordHash: string; role: string; employeeId: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO users (id, employee_id, name, work_email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [id, data.employeeId, data.name, data.workEmail, data.passwordHash, data.role]
  );
  return id;
}

export async function update(id: string, data: { name?: string; role?: string; isActive?: boolean }): Promise<void> {
  const fields: string[] = [];
  const params: any[]    = [];

  if (data.name     !== undefined) { fields.push('name = ?');      params.push(data.name); }
  if (data.role     !== undefined) { fields.push('role = ?');      params.push(data.role); }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); params.push(data.isActive ? 1 : 0); }

  if (!fields.length) return;
  params.push(id);
  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
}

export async function countActiveAdmins(): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'Admin' AND is_active = 1"
  );
  return (rows[0] as RowDataPacket).total as number;
}

export async function employeeExists(employeeId: string): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id FROM employees WHERE id = ? AND status = ?', [employeeId, 'active']
  );
  return rows.length > 0;
}
