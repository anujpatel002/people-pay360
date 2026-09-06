/**
 * dashboard-timeoff.repository.ts
 * Read-only time-off queries for the dashboard aggregator.
 */
import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { DashboardFilters, TimeOffOverview, TimeOffBalanceByType } from '../types/dashboard.types';

function buildPeriodRange(period?: string): { start: string; end: string } | null {
  if (!period) return null;
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return null;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function buildEmployeeScope(filters: DashboardFilters): { sql: string; params: unknown[] } {
  const conditions: string[] = ["status = 'active'"];
  const params: unknown[] = [];

  if (filters.companyId) {
    conditions.push('company_id = ?');
    params.push(filters.companyId);
  }
  if (filters.departmentId) {
    conditions.push('department_id = ?');
    params.push(filters.departmentId);
  }
  if (filters.employmentType) {
    conditions.push('employment_type = ?');
    params.push(filters.employmentType);
  }

  return {
    sql: `SELECT id FROM employees WHERE ${conditions.join(' AND ')}`,
    params,
  };
}

export async function getApprovedTimeOffDays(filters: DashboardFilters): Promise<number> {
  const empScope = buildEmployeeScope(filters);
  const conditions: string[] = [
    "status = 'Approved'",
    `employee_id IN (${empScope.sql})`,
  ];
  const params: unknown[] = [...empScope.params];

  const range = buildPeriodRange(filters.period);
  if (range) {
    conditions.push('start_date <= ? AND end_date >= ?');
    params.push(range.end, range.start);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const [rows] = await pool.execute<(RowDataPacket & { total_days: number })[]>(`
    SELECT COALESCE(SUM(days), 0) AS total_days
    FROM time_off_requests
    ${where}
  `, params as any[]);

  const row = rows[0];
  return Number(row?.total_days ?? 0);
}

export async function getTimeOffOverview(filters: DashboardFilters): Promise<TimeOffOverview> {
  const empScope = buildEmployeeScope(filters);
  const range = buildPeriodRange(filters.period);

  // 1. Approved days
  const approvedDays = await getApprovedTimeOffDays(filters);

  // 2. Pending requests (status = 'Confirmed')
  const pendingConditions: string[] = [
    "status = 'Confirmed'",
    `employee_id IN (${empScope.sql})`,
  ];
  const pendingParams: unknown[] = [...empScope.params];

  if (range) {
    pendingConditions.push('start_date <= ? AND end_date >= ?');
    pendingParams.push(range.end, range.start);
  }

  const [pendingRows] = await pool.execute<(RowDataPacket & { pending_count: number })[]>(`
    SELECT COUNT(id) AS pending_count
    FROM time_off_requests
    WHERE ${pendingConditions.join(' AND ')}
  `, pendingParams as any[]);

  const pendingRequests = Number(pendingRows[0]?.pending_count ?? 0);

  // 3. Leave Balances by Type
  const currentYear = range ? Number(filters.period!.split('-')[0]) : new Date().getFullYear();

  const [types] = await pool.execute<(RowDataPacket & {
    id: string;
    name: string;
    allocation_required: number;
  })[]>(`
    SELECT id, name, allocation_required
    FROM time_off_types
    WHERE is_active = 1
    ORDER BY name ASC
  `);

  const balancesByType: TimeOffBalanceByType[] = [];

  for (const t of types) {
    if (t.allocation_required === 0) {
      balancesByType.push({
        typeId: t.id,
        typeName: t.name,
        totalRemaining: null,
      });
    } else {
      const allocParams = [t.id, currentYear, ...empScope.params];
      const [allocRows] = await pool.execute<(RowDataPacket & { remaining: number | null })[]>(`
        SELECT SUM(total_days - used_days) AS remaining
        FROM time_off_allocations
        WHERE type_id = ?
          AND year = ?
          AND status = 'Approved'
          AND employee_id IN (${empScope.sql})
      `, allocParams as any[]);

      const allocRow = allocRows[0];
      balancesByType.push({
        typeId: t.id,
        typeName: t.name,
        totalRemaining: allocRow?.remaining !== null && allocRow?.remaining !== undefined
          ? Number(allocRow.remaining)
          : 0,
      });
    }
  }

  return {
    approvedDays,
    pendingRequests,
    balancesByType,
  };
}
