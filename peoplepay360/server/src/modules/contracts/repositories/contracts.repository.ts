import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';
import { ContractRow, toContract } from '../models/contract.model';
import { Contract, ContractFilters } from '../models/contract.types';
import { PaginatedResult } from '../../../shared/types';

const BASE_SELECT = `
  SELECT
    c.*,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    ws.name  AS schedule_name,
    ss.name  AS structure_name
  FROM contracts c
  LEFT JOIN employees        e  ON e.id  = c.employee_id
  LEFT JOIN working_schedules ws ON ws.id = c.schedule_id
  LEFT JOIN salary_structures ss ON ss.id = c.structure_id
`;

export async function findAll(filters: ContractFilters): Promise<PaginatedResult<Contract>> {
  const { employeeId, status, page = 1, limit: rawLimit = 20 } = filters;
  const limit  = Math.min(Math.max(rawLimit, 1), 100);
  const offset = (Math.max(page, 1) - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[]    = [];

  if (employeeId) { conditions.push('c.employee_id = ?'); params.push(employeeId); }
  if (status)     { conditions.push('c.status = ?');      params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM contracts c ${where}`, params as any[]
  );

  const [rows] = await pool.execute<ContractRow[]>(
    `${BASE_SELECT} ${where} ORDER BY c.start_date DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset] as any[]
  );

  return { data: rows.map(toContract), total, page, limit };
}

export async function findById(id: string): Promise<Contract | null> {
  const [rows] = await pool.execute<ContractRow[]>(
    `${BASE_SELECT} WHERE c.id = ?`, [id] as any[]
  );
  return rows[0] ? toContract(rows[0]) : null;
}

export async function findActiveForPeriod(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<Contract[]> {
  const [rows] = await pool.execute<ContractRow[]>(
    `${BASE_SELECT}
     WHERE c.employee_id = ?
       AND c.status = 'Running'
       AND c.start_date <= ?
       AND (c.end_date IS NULL OR c.end_date >= ?)`,
    [employeeId, periodEnd, periodStart] as any[]
  );
  return rows.map(toContract);
}

export async function findOverlappingRunning(
  employeeId: string,
  startDate: string,
  endDate: string | null,
  excludeId?: string
): Promise<Contract[]> {
  const params: unknown[] = [employeeId, endDate ?? '9999-12-31', startDate];
  let sql = `
    SELECT c.* FROM contracts c
    WHERE c.employee_id = ?
      AND c.status = 'Running'
      AND c.start_date <= ?
      AND (c.end_date IS NULL OR c.end_date >= ?)
  `;
  if (excludeId) { sql += ' AND c.id <> ?'; params.push(excludeId); }
  const [rows] = await pool.execute<ContractRow[]>(sql, params as any[]);
  return rows.map(toContract);
}

export async function create(data: Record<string, unknown>): Promise<Contract> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO contracts
      (id, employee_id, contract_ref, status, department, job_position,
       wage, start_date, end_date, schedule_id, structure_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ([
      id,
      data.employeeId, data.contractRef ?? null,
      data.status ?? 'New', data.department ?? null, data.jobPosition ?? null,
      data.wage, data.startDate, data.endDate ?? null,
      data.scheduleId ?? null, data.structureId ?? null, data.notes ?? null,
    ]) as any[]
  );
  return (await findById(id))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<Contract> {
  const fieldMap: Record<string, string> = {
    contractRef: 'contract_ref', status: 'status',
    department: 'department', jobPosition: 'job_position',
    wage: 'wage', startDate: 'start_date', endDate: 'end_date',
    scheduleId: 'schedule_id', structureId: 'structure_id', notes: 'notes',
  };

  const sets: string[]   = [];
  const params: unknown[] = [];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) { sets.push(`${col} = ?`); params.push(data[key] ?? null); }
  }

  if (!sets.length) return (await findById(id))!;

  params.push(id);
  await pool.execute<ResultSetHeader>(
    `UPDATE contracts SET ${sets.join(', ')} WHERE id = ?`, params as any[]
  );
  return (await findById(id))!;
}
