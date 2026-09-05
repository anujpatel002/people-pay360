import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';

export interface EmploymentTypeRow {
  id: string;
  name: string;
}

export async function findAll(): Promise<EmploymentTypeRow[]> {
  const [rows] = await pool.execute<
    (RowDataPacket & {
      employment_type: string;
    })[]
  >(`
    SELECT DISTINCT employment_type
    FROM employees
    WHERE employment_type IS NOT NULL
      AND employment_type <> ''
    ORDER BY employment_type ASC
  `);

  return rows.map((row) => ({
    id: row.employment_type,
    name: formatEmploymentType(row.employment_type),
  }));
}

function formatEmploymentType(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}