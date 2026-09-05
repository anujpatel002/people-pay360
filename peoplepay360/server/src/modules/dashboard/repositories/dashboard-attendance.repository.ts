/**
 * dashboard-attendance.repository.ts
 * Read-only attendance queries for the dashboard aggregator.
 */
import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { DashboardFilters, AttendanceOverview } from '../types/dashboard.types';

function buildDateRange(period?: string): { start: string; end: string } | null {
  if (!period) return null;
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return null;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export async function getAttendanceOverview(filters: DashboardFilters): Promise<AttendanceOverview> {
  const empConditions: string[] = ["e.status = 'active'"];
  const empParams: unknown[] = [];
  if (filters.companyId) { empConditions.push('e.company_id = ?'); empParams.push(filters.companyId); }
  if (filters.departmentId) { empConditions.push('e.department_id = ?'); empParams.push(filters.departmentId); }
  if (filters.employmentType) { empConditions.push('e.employment_type = ?'); empParams.push(filters.employmentType); }

  const conditions: string[] = [
    `a.employee_id IN (
    SELECT e.id
    FROM employees e
    WHERE ${empConditions.join(' AND ')}
  )`
  ]; 
  const params: unknown[] = [...empParams];

  const range = buildDateRange(filters.period);
  if (range) {
    conditions.push('a.date >= ? AND a.date <= ?');
    params.push(range.start, range.end);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const [[stats]] = await pool.execute<(RowDataPacket & {
    present: number; late: number; absent: number; overtime: number;
    missing_check_outs: number; manual_edits: number;
    expected_employee_days: number; present_employee_days: number;
  })[]>(`
    SELECT
      SUM(CASE WHEN a.status = 'Present'             THEN 1 ELSE 0 END) AS present,
      SUM(CASE WHEN a.status = 'Late'                THEN 1 ELSE 0 END) AS late,
      SUM(CASE WHEN a.status = 'Absent'              THEN 1 ELSE 0 END) AS absent,
      SUM(CASE WHEN a.overtime_minutes > 0           THEN 1 ELSE 0 END) AS overtime,
      SUM(CASE WHEN a.check_out IS NULL
               AND a.status = 'Missing Check-Out'   THEN 1 ELSE 0 END) AS missing_check_outs,
      SUM(CASE WHEN a.is_manual_entry = 1            THEN 1 ELSE 0 END) AS manual_edits,
      COUNT(a.id)                                                        AS expected_employee_days,
      SUM(CASE WHEN a.status IN ('Present','Late','Overtime') THEN 1 ELSE 0 END) AS present_employee_days
    FROM attendance_records a
    ${where}
  `, params as any[]);

  const expectedDays = Number(stats?.expected_employee_days ?? 0);
  const presentDays = Number(stats?.present_employee_days ?? 0);
  const coveragePercent = expectedDays > 0
    ? Math.round((presentDays / expectedDays) * 1000) / 10
    : 0;

  return {
    present: Number(stats?.present ?? 0),
    late: Number(stats?.late ?? 0),
    absent: Number(stats?.absent ?? 0),
    overtime: Number(stats?.overtime ?? 0),
    missingCheckOuts: Number(stats?.missing_check_outs ?? 0),
    manualEdits: Number(stats?.manual_edits ?? 0),
    coveragePercent,
  };
}
