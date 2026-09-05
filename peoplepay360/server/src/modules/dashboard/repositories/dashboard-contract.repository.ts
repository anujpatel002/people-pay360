/**
 * dashboard-contract.repository.ts
 * Read-only contract queries for dashboard alerts and analytics.
 */
import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';

export interface ExpiringContractRow {
  contractId: string;
  employeeId: string;
  companyId: string | null;
  endDate: string;
  employeeName: string;
}

export async function findExpiringContracts(companyId?: string, daysWindow = 30): Promise<ExpiringContractRow[]> {
  const conditions: string[] = [
    "c.status = 'Running'",
    "c.end_date IS NOT NULL",
    "c.end_date >= CURRENT_DATE()",
    `c.end_date <= DATE_ADD(CURRENT_DATE(), INTERVAL ${Math.max(1, Math.floor(daysWindow))} DAY)`,
  ];
  const params: unknown[] = [];

  if (companyId) {
    conditions.push('e.company_id = ?');
    params.push(companyId);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [rows] = await pool.execute<(RowDataPacket & {
    contract_id: string;
    employee_id: string;
    company_id: string | null;
    end_date: string;
    employee_name: string;
  })[]>(`
    SELECT
      c.id AS contract_id,
      c.employee_id,
      e.company_id AS company_id,
      DATE_FORMAT(c.end_date, '%Y-%m-%d') AS end_date,
      CONCAT(e.first_name, ' ', e.last_name) AS employee_name
    FROM contracts c
    JOIN employees e ON e.id = c.employee_id
    ${where}
    ORDER BY c.end_date ASC
  `, params as any[]);

  return rows.map(r => ({
    contractId: r.contract_id,
    employeeId: r.employee_id,
    companyId: r.company_id,
    endDate: r.end_date,
    employeeName: r.employee_name,
  }));
}
