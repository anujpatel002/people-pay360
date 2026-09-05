import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';

export interface RuleRow extends RowDataPacket {
  id: string; structure_id: string; code: string; name: string;
  category: string; sequence: number; computation_method: string;
  amount: number | null; percentage: number | null; formula: string | null;
  is_active: number; created_at: Date; updated_at: Date;
}

export async function findByStructure(structureId: string): Promise<RuleRow[]> {
  const [rows] = await pool.execute<RuleRow[]>(
    'SELECT * FROM salary_rules WHERE structure_id = ? ORDER BY sequence ASC, code ASC',
    [structureId]
  );
  return rows;
}

export async function findById(id: string): Promise<RuleRow | null> {
  const [rows] = await pool.execute<RuleRow[]>(
    'SELECT * FROM salary_rules WHERE id = ?', [id]
  );
  return rows[0] ?? null;
}

export async function findByCode(structureId: string, code: string): Promise<RuleRow | null> {
  const [rows] = await pool.execute<RuleRow[]>(
    'SELECT id FROM salary_rules WHERE structure_id = ? AND code = ?', [structureId, code]
  );
  return rows[0] ?? null;
}

export async function create(data: {
  structureId: string; code: string; name: string; category: string;
  sequence: number; computationMethod: string;
  amount?: number | null; percentage?: number | null; formula?: string | null;
  isActive: boolean;
}): Promise<string> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO salary_rules
      (id, structure_id, code, name, category, sequence, computation_method, amount, percentage, formula, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.structureId, data.code, data.name, data.category, data.sequence,
     data.computationMethod, data.amount ?? null, data.percentage ?? null,
     data.formula ?? null, data.isActive ? 1 : 0]
  );
  return id;
}

export async function update(id: string, data: Record<string, unknown>) {
  const fieldMap: Record<string, string> = {
    name: 'name', category: 'category', sequence: 'sequence',
    computationMethod: 'computation_method', amount: 'amount',
    percentage: 'percentage', formula: 'formula', isActive: 'is_active',
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) {
      sets.push(`${col} = ?`);
      let val = data[key];
      if (key === 'isActive') val = val ? 1 : 0;
      params.push(val ?? null);
    }
  }
  if (!sets.length) return;
  params.push(id);
  await pool.execute(`UPDATE salary_rules SET ${sets.join(', ')} WHERE id = ?`, params as any[]);
}

export async function remove(id: string) {
  await pool.execute('DELETE FROM salary_rules WHERE id = ?', [id]);
}
