import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { Company } from '../types/dashboard.types';

interface CompanyRow extends RowDataPacket {
  id: string; code: string; name: string; currency_code: string;
  is_active: number; created_at: string; updated_at: string; deleted_at: string | null;
}

function toCompany(row: CompanyRow): Company {
  return {
    id: row.id, code: row.code, name: row.name,
    currencyCode: row.currency_code, isActive: Boolean(row.is_active),
    createdAt: row.created_at, updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function findAll(onlyActive = true): Promise<Company[]> {
  const where = onlyActive ? 'WHERE is_active = 1 AND deleted_at IS NULL' : '';
  const [rows] = await pool.execute<CompanyRow[]>(
    `SELECT * FROM companies ${where} ORDER BY name ASC`
  );
  return rows.map(toCompany);
}

export async function findById(id: string): Promise<Company | null> {
  const [rows] = await pool.execute<CompanyRow[]>(
    'SELECT * FROM companies WHERE id = ?', [id]
  );
  return rows[0] ? toCompany(rows[0]) : null;
}

export async function create(data: {
  code: string; name: string; currencyCode?: string;
}): Promise<Company> {
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO companies (id, code, name, currency_code) VALUES (?, ?, ?, ?)`,
    [id, data.code, data.name, data.currencyCode ?? 'INR']
  );
  return (await findById(id))!;
}
