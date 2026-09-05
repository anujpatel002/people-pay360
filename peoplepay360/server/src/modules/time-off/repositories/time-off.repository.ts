import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';
import {
  TimeOffTypeRow, toTimeOffType, TimeOffType,
  AllocationRow, toAllocation, Allocation,
  TimeOffRequestRow, toTimeOffRequest, TimeOffRequest,
} from '../models/time-off.types';
import { PaginatedResult } from '../../../shared/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export async function findAllTypes(onlyActive?: boolean): Promise<TimeOffType[]> {
  const where = onlyActive ? 'WHERE is_active = 1' : '';
  const [rows] = await pool.execute<TimeOffTypeRow[]>(
    `SELECT * FROM time_off_types ${where} ORDER BY name ASC`
  );
  return rows.map(toTimeOffType);
}

export async function findTypeById(id: string): Promise<TimeOffType | null> {
  const [rows] = await pool.execute<TimeOffTypeRow[]>(
    'SELECT * FROM time_off_types WHERE id = ?', [id] as any[]
  );
  return rows[0] ? toTimeOffType(rows[0]) : null;
}

export async function createType(data: {
  name: string; unit: string; allocationRequired: boolean;
  approvalMode: string; isPaid: boolean;
  workEntry?: string; color?: string; notes?: string;
}): Promise<TimeOffType> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO time_off_types
      (id, name, unit, allocation_required, approval_mode, is_paid, work_entry, color, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.unit, data.allocationRequired ? 1 : 0,
     data.approvalMode, data.isPaid ? 1 : 0,
     data.workEntry ?? null, data.color ?? null, data.notes ?? null] as any[]
  );
  return (await findTypeById(id))!;
}

export async function updateType(id: string, data: Record<string, unknown>): Promise<TimeOffType> {
  const fieldMap: Record<string, string> = {
    name: 'name', unit: 'unit', allocationRequired: 'allocation_required',
    approvalMode: 'approval_mode', isPaid: 'is_paid',
    workEntry: 'work_entry', color: 'color', notes: 'notes', isActive: 'is_active',
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) {
      const val = data[key];
      sets.push(`${col} = ?`);
      params.push(typeof val === 'boolean' ? (val ? 1 : 0) : (val ?? null));
    }
  }
  if (sets.length) {
    params.push(id);
    await pool.execute(`UPDATE time_off_types SET ${sets.join(', ')} WHERE id = ?`, params as any[]);
  }
  return (await findTypeById(id))!;
}

// ─── Allocations ──────────────────────────────────────────────────────────────

const ALLOC_SELECT = `
  SELECT a.*,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    t.name AS type_name,
    u.name AS approver_name
  FROM time_off_allocations a
  JOIN employees e ON e.id = a.employee_id
  JOIN time_off_types t ON t.id = a.type_id
  LEFT JOIN users u ON u.id = a.approver_id
`;

export async function findAllocations(filters: {
  employeeId?: string; typeId?: string; year?: number;
  page?: number; limit?: number;
}): Promise<PaginatedResult<Allocation>> {
  const { employeeId, typeId, year, page = 1, limit = 20 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (employeeId) { conditions.push('a.employee_id = ?'); params.push(employeeId); }
  if (typeId)     { conditions.push('a.type_id = ?');     params.push(typeId); }
  if (year)       { conditions.push('a.year = ?');        params.push(year); }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Math.max(page, 1) - 1) * limit;

  const [[{ total }]] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM time_off_allocations a ${where}`, params as any[]
  );
  const [rows] = await pool.execute<AllocationRow[]>(
    `${ALLOC_SELECT} ${where} ORDER BY a.year DESC, employee_name ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset] as any[]
  );
  return { data: rows.map(toAllocation), total, page, limit };
}

export async function findAllocationById(id: string): Promise<Allocation | null> {
  const [rows] = await pool.execute<AllocationRow[]>(
    `${ALLOC_SELECT} WHERE a.id = ?`, [id] as any[]
  );
  return rows[0] ? toAllocation(rows[0]) : null;
}

export async function findAllocationForBalance(
  employeeId: string, typeId: string, year: number
): Promise<Allocation | null> {
  const [rows] = await pool.execute<AllocationRow[]>(
    `${ALLOC_SELECT} WHERE a.employee_id = ? AND a.type_id = ? AND a.year = ? AND a.status = 'Approved'`,
    [employeeId, typeId, year] as any[]
  );
  return rows[0] ? toAllocation(rows[0]) : null;
}

export async function createAllocation(data: {
  employeeId: string; typeId: string; year: number;
  totalDays: number; validityStart: string; validityEnd: string;
  approverId?: string;
}): Promise<Allocation> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO time_off_allocations
      (id, employee_id, type_id, year, total_days, used_days, validity_start, validity_end, approver_id, status)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 'Approved')`,
    [id, data.employeeId, data.typeId, data.year, data.totalDays,
     data.validityStart, data.validityEnd, data.approverId ?? null] as any[]
  );
  return (await findAllocationById(id))!;
}

export async function updateAllocation(id: string, data: Record<string, unknown>): Promise<Allocation> {
  const fieldMap: Record<string, string> = {
    totalDays: 'total_days', usedDays: 'used_days',
    validityStart: 'validity_start', validityEnd: 'validity_end',
    approverId: 'approver_id', status: 'status',
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) { sets.push(`${col} = ?`); params.push(data[key] ?? null); }
  }
  if (sets.length) {
    params.push(id);
    await pool.execute(`UPDATE time_off_allocations SET ${sets.join(', ')} WHERE id = ?`, params as any[]);
  }
  return (await findAllocationById(id))!;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

const REQ_SELECT = `
  SELECT r.*,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    t.name AS type_name
  FROM time_off_requests r
  JOIN employees e ON e.id = r.employee_id
  JOIN time_off_types t ON t.id = r.type_id
`;

export async function findRequests(filters: {
  employeeId?: string; typeId?: string; status?: string;
  dateFrom?: string; dateTo?: string; page?: number; limit?: number;
}): Promise<PaginatedResult<TimeOffRequest>> {
  const { employeeId, typeId, status, dateFrom, dateTo, page = 1, limit = 20 } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (employeeId) { conditions.push('r.employee_id = ?'); params.push(employeeId); }
  if (typeId)     { conditions.push('r.type_id = ?');     params.push(typeId); }
  if (status)     { conditions.push('r.status = ?');      params.push(status); }
  if (dateFrom)   { conditions.push('r.start_date >= ?'); params.push(dateFrom); }
  if (dateTo)     { conditions.push('r.end_date <= ?');   params.push(dateTo); }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Math.max(page, 1) - 1) * limit;

  const [[{ total }]] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM time_off_requests r ${where}`, params as any[]
  );
  const [rows] = await pool.execute<TimeOffRequestRow[]>(
    `${REQ_SELECT} ${where} ORDER BY r.start_date DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset] as any[]
  );
  return { data: rows.map(toTimeOffRequest), total, page, limit };
}

export async function findRequestById(id: string): Promise<TimeOffRequest | null> {
  const [rows] = await pool.execute<TimeOffRequestRow[]>(
    `${REQ_SELECT} WHERE r.id = ?`, [id] as any[]
  );
  return rows[0] ? toTimeOffRequest(rows[0]) : null;
}

export async function createRequest(data: {
  employeeId: string; typeId: string; allocationId: string | null;
  startDate: string; endDate: string; days: number; reason?: string;
}): Promise<TimeOffRequest> {
  const id = crypto.randomUUID();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO time_off_requests
      (id, employee_id, type_id, allocation_id, start_date, end_date, days, status, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)`,
    [id, data.employeeId, data.typeId, data.allocationId,
     data.startDate, data.endDate, data.days, data.reason ?? null] as any[]
  );
  return (await findRequestById(id))!;
}

export async function updateRequest(id: string, data: Record<string, unknown>): Promise<TimeOffRequest> {
  const fieldMap: Record<string, string> = {
    status: 'status', refusalReason: 'refusal_reason', allocationId: 'allocation_id',
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) { sets.push(`${col} = ?`); params.push(data[key] ?? null); }
  }
  if (sets.length) {
    params.push(id);
    await pool.execute(`UPDATE time_off_requests SET ${sets.join(', ')} WHERE id = ?`, params as any[]);
  }
  return (await findRequestById(id))!;
}

// ─── Balance ──────────────────────────────────────────────────────────────────

export async function getBalances(employeeId: string): Promise<{
  typeId: string; typeName: string; unit: string;
  allocated: number | null; taken: number | null;
  remaining: number | null; validityEnd: string | null;
}[]> {
  const [rows] = await pool.execute<(RowDataPacket & {
    type_id: string; type_name: string; unit: string;
    total_days: number | null; used_days: number | null; validity_end: string | null;
  })[]>(
    `SELECT t.id AS type_id, t.name AS type_name, t.unit,
            a.total_days, a.used_days, a.validity_end
     FROM time_off_types t
     LEFT JOIN time_off_allocations a
       ON a.type_id = t.id AND a.employee_id = ? AND a.status = 'Approved'
          AND a.year = YEAR(CURDATE())
     WHERE t.is_active = 1
     ORDER BY t.name ASC`,
    [employeeId] as any[]
  );
  return rows.map(r => ({
    typeId: r.type_id,
    typeName: r.type_name,
    unit: r.unit,
    allocated:  r.total_days !== null ? Number(r.total_days) : null,
    taken:      r.used_days  !== null ? Number(r.used_days)  : null,
    remaining:  r.total_days !== null ? Math.max(0, Number(r.total_days) - Number(r.used_days)) : null,
    validityEnd: r.validity_end,
  }));
}
