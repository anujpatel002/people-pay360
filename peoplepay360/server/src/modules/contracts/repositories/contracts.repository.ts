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
  const { employeeId, search, status, department, companyId, sortBy, sortOrder = 'desc', page = 1, limit: rawLimit = 20 } = filters;
  const limit  = Math.min(Math.max(rawLimit, 1), 100);
  const offset = (Math.max(page, 1) - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[]    = [];

  if (employeeId) { conditions.push('c.employee_id = ?'); params.push(employeeId); }
  if (status)     { conditions.push('c.status = ?');      params.push(status); }
  if (department) { conditions.push('c.department LIKE ?'); params.push(`%${department}%`); }
  if (companyId)  { conditions.push('e.company_id = ?');  params.push(companyId); }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push('(c.contract_ref LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR CONCAT(e.first_name, " ", e.last_name) LIKE ? OR c.job_position LIKE ? OR c.department LIKE ?)');
    params.push(term, term, term, term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM contracts c LEFT JOIN employees e ON e.id = c.employee_id ${where}`, params as any[]
  );
  const total = Number((countRows[0] as any)?.total ?? 0);

  const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  let orderClause = `c.start_date ${direction}`;

  if (sortBy === 'wage') {
    orderClause = `c.wage ${direction}`;
  } else if (sortBy === 'startDate') {
    orderClause = `c.start_date ${direction}`;
  } else if (sortBy === 'endDate') {
    orderClause = `c.end_date ${direction}`;
  } else if (sortBy === 'status') {
    orderClause = `c.status ${direction}`;
  } else if (sortBy === 'contractRef') {
    orderClause = `c.contract_ref ${direction}`;
  } else if (sortBy === 'employeeName') {
    orderClause = `e.first_name ${direction}, e.last_name ${direction}`;
  }

  const [rows] = await pool.execute<ContractRow[]>(
    `${BASE_SELECT} ${where} ORDER BY ${orderClause} LIMIT ? OFFSET ?`,
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

export async function getLookups() {
  const [employees] = await pool.execute<RowDataPacket[]>(
    `SELECT e.id, e.first_name, e.last_name, e.employee_number, e.job_title, e.schedule_id, e.company_id, e.work_email,
            d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.status = 'active'
     ORDER BY e.first_name ASC, e.last_name ASC`
  );

  const [departments] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, code FROM departments WHERE is_active = 1 AND deleted_at IS NULL ORDER BY name ASC'
  );

  const [schedules] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, weekly_hours, company, timezone FROM working_schedules WHERE is_active = 1 ORDER BY name ASC'
  );

  const [structures] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, is_active FROM salary_structures WHERE is_active = 1 ORDER BY name ASC'
  );

  const [jobPositions] = await pool.execute<RowDataPacket[]>(
    `SELECT DISTINCT e.job_title AS title, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.job_title IS NOT NULL AND TRIM(e.job_title) <> ''
     ORDER BY e.job_title ASC`
  );

  return {
    employees: employees.map((e) => ({
      id: e.id,
      firstName: e.first_name,
      lastName: e.last_name,
      name: `${e.first_name} ${e.last_name}`,
      employeeNumber: e.employee_number ?? undefined,
      departmentName: e.department_name ?? undefined,
      jobTitle: e.job_title ?? undefined,
      scheduleId: e.schedule_id ?? undefined,
      companyId: e.company_id ?? undefined,
      workEmail: e.work_email ?? undefined,
    })),
    departments: departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
    })),
    schedules: schedules.map((s) => ({
      id: s.id,
      name: s.name,
      weeklyHours: Number(s.weekly_hours),
      company: s.company,
      timezone: s.timezone,
    })),
    structures: structures.map((st) => ({
      id: st.id,
      name: st.name,
      isActive: Boolean(st.is_active),
    })),
    jobPositions: jobPositions.map((jp) => ({
      title: jp.title,
      departmentName: jp.department_name ?? undefined,
    })),
  };
}
