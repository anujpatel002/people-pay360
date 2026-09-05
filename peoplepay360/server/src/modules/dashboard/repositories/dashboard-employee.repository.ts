/**
 * dashboard-employee.repository.ts
 * Read-only employee queries for the dashboard aggregator.
 */
import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { DashboardFilters } from '../types/dashboard.types';

export interface DepartmentHeadcountRow {
  departmentId: string | null;
  department: string;
  headcount: number;
}

export async function getDepartmentHeadcounts(
  filters: DashboardFilters
): Promise<DepartmentHeadcountRow[]> {
  const conditions: string[] = ["e.status = 'active'"];
  const params: unknown[] = [];

  if (filters.companyId) {
    conditions.push('e.company_id = ?');
    params.push(filters.companyId);
  }

  if (filters.departmentId) {
    conditions.push('e.department_id = ?');
    params.push(filters.departmentId);
  }

  if (filters.employmentType) {
    conditions.push('e.employment_type = ?');
    params.push(filters.employmentType);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await pool.execute<
    (RowDataPacket & {
      department_id: string | null;
      department: string;
      headcount: number;
    })[]
  >(`
    SELECT
      e.department_id AS department_id,
      COALESCE(d.name, 'Unassigned') AS department,
      COUNT(e.id) AS headcount
    FROM employees e
    LEFT JOIN departments d
      ON d.id = e.department_id
      AND d.deleted_at IS NULL
    ${where}
    GROUP BY e.department_id, d.name
    ORDER BY headcount DESC
  `, params as any[]);

  return rows.map(r => ({
    departmentId: r.department_id ?? null,
    department: r.department || 'Unassigned',
    headcount: Number(r.headcount || 0),
  }));
}

export async function getActiveEmployeeCount(
  filters: DashboardFilters
): Promise<number> {
  const conditions: string[] = ["e.status = 'active'"];
  const params: unknown[] = [];

  if (filters.companyId) {
    conditions.push('e.company_id = ?');
    params.push(filters.companyId);
  }

  if (filters.departmentId) {
    conditions.push('e.department_id = ?');
    params.push(filters.departmentId);
  }

  if (filters.employmentType) {
    conditions.push('e.employment_type = ?');
    params.push(filters.employmentType);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [[row]] = await pool.execute<
    (RowDataPacket & { total: number })[]
  >(`
    SELECT COUNT(e.id) AS total
    FROM employees e
    ${where}
  `, params as any[]);

  return Number(row?.total ?? 0);
}