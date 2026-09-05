import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';

export interface StructureRow extends RowDataPacket {
  id: string; name: string; is_active: number;
  created_at: Date; updated_at: Date;
  rule_count?: number; employee_count?: number;
}

export async function findAll(filters: { search?: string; isActive?: boolean }) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.search)    { conditions.push('s.name LIKE ?'); params.push(`%${filters.search}%`); }
  if (filters.isActive !== undefined) { conditions.push('s.is_active = ?'); params.push(filters.isActive ? 1 : 0); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.execute<StructureRow[]>(
    `SELECT s.*,
       (SELECT COUNT(*) FROM salary_rules r WHERE r.structure_id = s.id) AS rule_count,
       (SELECT COUNT(*) FROM contracts c WHERE c.structure_id = s.id) AS employee_count
     FROM salary_structures s ${where} ORDER BY s.name ASC`,
    params as any[]
  );
  return rows;
}

export async function findById(id: string) {
  const [rows] = await pool.execute<StructureRow[]>(
    `SELECT s.*,
       (SELECT COUNT(*) FROM salary_rules r WHERE r.structure_id = s.id) AS rule_count,
       (SELECT COUNT(*) FROM contracts c WHERE c.structure_id = s.id) AS employee_count
     FROM salary_structures s WHERE s.id = ?`, [id]
  );
  return rows[0] ?? null;
}

export async function findByName(name: string) {
  const [rows] = await pool.execute<StructureRow[]>(
    'SELECT id FROM salary_structures WHERE name = ?', [name]
  );
  return rows[0] ?? null;
}

export async function create(data: { name: string; isActive: boolean }): Promise<string> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    'INSERT INTO salary_structures (id, name, is_active) VALUES (?, ?, ?)',
    [id, data.name, data.isActive ? 1 : 0]
  );
  return id;
}

export async function update(id: string, data: { name?: string; isActive?: boolean }) {
  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.name     !== undefined) { fields.push('name = ?');      params.push(data.name); }
  if (data.isActive !== undefined) { fields.push('is_active = ?'); params.push(data.isActive ? 1 : 0); }
  if (!fields.length) return;
  params.push(id);
  await pool.execute(`UPDATE salary_structures SET ${fields.join(', ')} WHERE id = ?`, params as any[]);
}

export async function remove(id: string) {
  await pool.execute('DELETE FROM salary_structures WHERE id = ?', [id]);
}

export async function isReferencedByContract(id: string): Promise<boolean> {
  const [[row]] = await pool.execute<(RowDataPacket & { total: number })[]>(
    'SELECT COUNT(*) AS total FROM contracts WHERE structure_id = ?', [id]
  );
  return row.total > 0;
}
