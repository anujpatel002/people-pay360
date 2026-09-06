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
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page: number;
  limit: number;
}

export async function findAll(filters: UserFilters): Promise<{ rows: UserRow[]; total: number }> {
  const { search, role, status, sortBy, sortOrder = 'DESC', page, limit } = filters;
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[]        = [];

  if (search) {
    conditions.push('(u.name LIKE ? OR u.work_email LIKE ? OR CONCAT(e.first_name, \' \', e.last_name) LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (role) {
    conditions.push('u.role = ?');
    params.push(role);
  }
  if (status === 'active') {
    conditions.push('u.is_active = 1');
  } else if (status === 'inactive') {
    conditions.push('u.is_active = 0');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     ${where}`,
    params
  );
  const total = (countRows[0] as RowDataPacket).total as number;

  const validSortCols: Record<string, string> = {
    name: 'u.name',
    workEmail: 'u.work_email',
    role: 'u.role',
    employeeName: 'employee_name',
    isActive: 'u.is_active',
    createdAt: 'u.created_at',
  };
  const orderCol = (sortBy && validSortCols[sortBy]) ? validSortCols[sortBy] : 'u.created_at';
  const orderDir = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const [rows] = await pool.execute<UserRow[]>(
    `SELECT u.id, u.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
            u.name, u.work_email, u.role, u.is_active, u.created_at, u.updated_at
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     ${where}
     ORDER BY ${orderCol} ${orderDir}
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
     LEFT JOIN employees e ON e.id = u.employee_id
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

export async function resolveEmployee(employeeId: string): Promise<{ id: string; name: string } | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, CONCAT(first_name, ' ', last_name) AS name FROM employees WHERE (id = ? OR employee_number = ?) AND status = ?`, [employeeId, employeeId, 'active']
  );
  if (!rows.length) return null;
  return { id: (rows[0] as any).id, name: (rows[0] as any).name };
}

export async function employeeExists(employeeId: string): Promise<boolean> {
  const emp = await resolveEmployee(employeeId);
  return Boolean(emp);
}
