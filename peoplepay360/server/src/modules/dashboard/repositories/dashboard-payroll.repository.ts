/**
 * dashboard-payroll.repository.ts
 * Read-only payroll queries for the dashboard aggregator.
 * All queries are SELECT only — no writes, no state changes.
 */
import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { DashboardFilters, SalaryByDepartment, MonthlySalaryTrend } from '../types/dashboard.types';

function buildPeriodRange(period?: string): { start: string; end: string } | null {
  if (!period) return null;
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return null;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

interface PayrunRow extends RowDataPacket {
  total_net: number; payslip_count: number;
}

/** Total net salary paid and payslip count for validated/paid payruns in the selected scope. */
export async function getPayrollTotals(filters: DashboardFilters): Promise<{
  totalNet: number; payslipCount: number;
}> {
  const conditions: string[] = ["r.status IN ('Validated','Paid')"];
  const params: unknown[] = [];

  const range = buildPeriodRange(filters.period);
  if (range) {
    conditions.push('r.period_start >= ? AND r.period_end <= ?');
    params.push(range.start, range.end);
  }
  if (filters.companyId) { conditions.push('r.company_id = ?'); params.push(filters.companyId); }
  if (filters.departmentId) {
    conditions.push(
      'p.employee_id IN (SELECT id FROM employees WHERE department_id = ?)'
    );
    params.push(filters.departmentId);
  }
  if (filters.employmentType) {
    conditions.push('p.employee_id IN (SELECT id FROM employees WHERE employment_type = ?)');
    params.push(filters.employmentType);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [rows] = await pool.execute<(RowDataPacket & { total_net: number; payslip_count: number })[]>(`
    SELECT
      COALESCE(SUM(p.net), 0) AS total_net,
      COUNT(p.id)             AS payslip_count
    FROM payslips p
    JOIN payruns r ON r.id = p.payrun_id
    ${where}
  `, params as any[]);

  const row = rows[0];
  return {
    totalNet: Number(row?.total_net ?? 0),
    payslipCount: Number(row?.payslip_count ?? 0),
  };
}

/** Net salary grouped by department, for the selected scope. Null dept → 'Unassigned'. */
export async function getSalaryByDepartment(filters: DashboardFilters): Promise<SalaryByDepartment[]> {
  const conditions: string[] = ["r.status IN ('Validated','Paid')"];
  const params: unknown[] = [];

  const range = buildPeriodRange(filters.period);
  if (range) {
    conditions.push('r.period_start >= ? AND r.period_end <= ?');
    params.push(range.start, range.end);
  }
  if (filters.companyId) { conditions.push('r.company_id = ?'); params.push(filters.companyId); }
  if (filters.employmentType) {
    conditions.push('p.employee_id IN (SELECT id FROM employees WHERE employment_type = ?)');
    params.push(filters.employmentType);
  }
  if (filters.departmentId) {
    conditions.push('e.department_id = ?');
    params.push(filters.departmentId);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [rows] = await pool.execute<(RowDataPacket & {
    department_id: string | null; department: string; total_net: number; headcount: number;
  })[]>(`
    SELECT
      e.department_id                              AS department_id,
      COALESCE(d.name, 'Unassigned')                  AS department,
      COALESCE(SUM(p.net), 0)                         AS total_net,
      COUNT(DISTINCT p.employee_id)                   AS headcount
    FROM payslips p
    JOIN payruns r ON r.id = p.payrun_id
    JOIN employees e ON e.id = p.employee_id
    LEFT JOIN departments d ON d.id = e.department_id
    ${where}
    GROUP BY e.department_id, d.name
    ORDER BY total_net DESC
  `, params as any[]);

  return rows.map(r => ({
    departmentId: r.department_id,
    department: r.department,
    totalNet: Number(r.total_net),
    headcount: Number(r.headcount),
  }));
}

/** Monthly net salary trend — last 4 payrun periods, ordered ascending. */
export async function getMonthlySalaryTrend(filters: DashboardFilters): Promise<MonthlySalaryTrend[]> {
  const conditions: string[] = ["r.status IN ('Validated','Paid')"];
  const params: unknown[] = [];

  if (filters.companyId) { conditions.push('r.company_id = ?'); params.push(filters.companyId); }
  if (filters.departmentId) {
    conditions.push('e.department_id = ?');
    params.push(filters.departmentId);
  }
  if (filters.employmentType) {
    conditions.push('e.employment_type = ?');
    params.push(filters.employmentType);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [rows] = await pool.execute<(RowDataPacket & { period: string; total_net: number })[]>(`
    SELECT
      DATE_FORMAT(r.period_end, '%Y-%m') AS period,
      COALESCE(SUM(p.net), 0)            AS total_net
    FROM payslips p
    JOIN payruns r ON r.id = p.payrun_id
    JOIN employees e ON e.id = p.employee_id
    ${where}
    GROUP BY DATE_FORMAT(r.period_end, '%Y-%m')
    ORDER BY period DESC
    LIMIT 4
  `, params as any[]);

  // Return ascending order (oldest first)
  return rows.reverse().map(r => ({
    period: r.period,
    totalNet: Number(r.total_net),
  }));
}

/** Alert-related payroll queries */

/** Count employees with missing bank details (no bank_account AND no iban). */
export async function countMissingBankDetails(companyId?: string): Promise<{ employeeId: string; companyId?: string }[]> {
  const conditions: string[] = ["(bank_account IS NULL OR bank_account = '') AND (iban IS NULL OR iban = '')", "status = 'active'"];
  const params: unknown[] = [];
  if (companyId) { conditions.push('company_id = ?'); params.push(companyId); }
  const [rows] = await pool.execute<(RowDataPacket & { id: string; company_id: string | null })[]>(
    `SELECT id, company_id FROM employees WHERE ${conditions.join(' AND ')}`,
    params as any[]
  );
  return rows.map(r => ({ employeeId: r.id, companyId: r.company_id || undefined }));
}

/** Detect duplicate payslips: employee has a payslip in two overlapping payruns. */
export async function findDuplicatePayslips(companyId?: string): Promise<{ employeeId: string; payrunId: string; companyId?: string }[]> {
  const companyFilter = companyId ? 'AND r.company_id = ?' : '';
  const params = companyId ? [companyId] : [];
  const [rows] = await pool.execute<(RowDataPacket & { employee_id: string; payrun_id: string; company_id: string | null })[]>(`
    SELECT p.employee_id, p.payrun_id, r.company_id
    FROM payslips p
    JOIN payruns r ON r.id = p.payrun_id
    WHERE r.status IN ('Draft','Computed','Validated','Paid') ${companyFilter}
      AND EXISTS (
        SELECT 1 FROM payslips p2
        JOIN payruns r2 ON r2.id = p2.payrun_id
        WHERE p2.employee_id = p.employee_id
          AND p2.payrun_id <> p.payrun_id
          AND r2.status IN ('Draft','Computed','Validated','Paid')
          AND r2.period_start <= r.period_end
          AND r2.period_end >= r.period_start
      )
    GROUP BY p.employee_id, p.payrun_id, r.company_id
  `, params as any[]);
  return rows.map(r => ({ employeeId: r.employee_id, payrunId: r.payrun_id, companyId: r.company_id || undefined }));
}

/** Find unvalidated payruns (Draft or Computed). */
export async function findUnvalidatedPayruns(companyId?: string): Promise<{ payrunId: string; status: string; companyId?: string }[]> {
  const conditions = ["status IN ('Draft','Computed')"];
  const params: unknown[] = [];
  if (companyId) { conditions.push('company_id = ?'); params.push(companyId); }
  const [rows] = await pool.execute<(RowDataPacket & { id: string; status: string; company_id: string | null })[]>(
    `SELECT id, status, company_id FROM payruns WHERE ${conditions.join(' AND ')}`,
    params as any[]
  );
  return rows.map(r => ({ payrunId: r.id, status: r.status, companyId: r.company_id || undefined }));
}
