import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { Department } from '../types/dashboard.types';

interface DepartmentRow extends RowDataPacket {
  id: string; company_id: string; code: string; name: string;
  manager_employee_id: string | null; is_active: number;
  created_at: string; updated_at: string; deleted_at: string | null;
}

function toDepartment(row: DepartmentRow): Department {
  return {
    id: row.id, companyId: row.company_id, code: row.code, name: row.name,
    managerEmployeeId: row.manager_employee_id,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at,
  };
}

export async function findAll(companyId?: string, onlyActive = true): Promise<Department[]> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  if (onlyActive) { conditions.push('is_active = 1'); }
  if (companyId)  { conditions.push('company_id = ?'); params.push(companyId); }
  const [rows] = await pool.execute<DepartmentRow[]>(
    `SELECT * FROM departments WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
    params as any[]
  );
  return rows.map(toDepartment);
}

export async function findById(id: string): Promise<Department | null> {
  const [rows] = await pool.execute<DepartmentRow[]>(
    'SELECT * FROM departments WHERE id = ?', [id]
  );
  return rows[0] ? toDepartment(rows[0]) : null;
}

export async function create(data: {
  companyId: string; code: string; name: string; managerEmployeeId?: string;
}): Promise<Department> {
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO departments (id, company_id, code, name, manager_employee_id) VALUES (?, ?, ?, ?, ?)`,
    [id, data.companyId, data.code, data.name, data.managerEmployeeId ?? null]
  );
  return (await findById(id))!;
}
