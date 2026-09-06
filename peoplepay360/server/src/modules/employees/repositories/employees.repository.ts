import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../../../database/connection/pool';
import { EmployeeRow, toEmployee } from '../models/employee.model';
import { Employee, EmployeeFilters, SmartCounts } from '../types/employee.types';
import { PaginatedResult } from '../../../shared/types';

const SORTABLE = new Set([
  'first_name', 'last_name', 'employee_number', 'work_email',
  'department_id', 'job_position_id', 'employment_type', 'hire_date', 'status',
]);

function toSnake(col: string): string {
  const map: Record<string, string> = {
    firstName: 'first_name', lastName: 'last_name',
    employeeNumber: 'employee_number', workEmail: 'work_email',
    department: 'department_id', jobPosition: 'job_position_id',
    employmentType: 'employment_type', hireDate: 'hire_date',
  };
  return map[col] ?? col;
}

export async function findAll(filters: EmployeeFilters): Promise<PaginatedResult<Employee>> {
  const {
    search, departmentId, status, employmentType, jobPositionId,
    managerId, companyId, location, scheduleId,
    sortBy = 'last_name', sortOrder = 'asc',
    page = 1, limit: rawLimit = 20,
  } = filters;

  const limit  = Math.min(Math.max(rawLimit, 1), 100);
  const offset = (Math.max(page, 1) - 1) * limit;

  const conditions: string[] = [];
  const params: any[]        = [];

  if (search) {
    conditions.push(
      `(e.first_name LIKE ? OR e.last_name LIKE ? OR CONCAT(e.first_name,' ',e.last_name) LIKE ?
       OR e.work_email LIKE ? OR e.employee_number LIKE ? OR e.job_title LIKE ?)`
    );
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like);
  }
  if (departmentId)   { conditions.push('e.department_id = ?');   params.push(departmentId); }
  if (status)         { conditions.push('e.status = ?');          params.push(status); }
  if (employmentType) { conditions.push('e.employment_type = ?'); params.push(employmentType); }
  if (jobPositionId)  { conditions.push('e.job_position_id = ?'); params.push(jobPositionId); }
  if (managerId)      { conditions.push('e.manager_id = ?');      params.push(managerId); }
  if (companyId)      { conditions.push('e.company_id = ?');      params.push(companyId); }
  if (location)       { conditions.push('e.location = ?');        params.push(location); }
  if (scheduleId)     { conditions.push('e.schedule_id = ?');     params.push(scheduleId); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const col   = SORTABLE.has(toSnake(sortBy)) ? `e.${toSnake(sortBy)}` : 'e.last_name';
  const dir   = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM employees e ${where}`, params
  );
  const total = Number((countRows[0] as any)?.total ?? 0);

  const [rows] = await pool.execute<EmployeeRow[]>(
    `SELECT e.*,
            d.name AS department_name,
            c.name AS company_name,
            ws.name AS schedule_name,
            CONCAT(m.first_name, ' ', m.last_name) AS manager_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     LEFT JOIN companies c ON c.id = e.company_id
     LEFT JOIN working_schedules ws ON ws.id = e.schedule_id
     LEFT JOIN employees m ON m.id = e.manager_id
     ${where}
     ORDER BY ${col} ${dir}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { data: rows.map(toEmployee), total, page, limit };
}

export async function findById(id: string): Promise<Employee | null> {
  const [rows] = await pool.execute<EmployeeRow[]>(
    `SELECT e.*,
            d.name AS department_name,
            c.name AS company_name,
            ws.name AS schedule_name,
            CONCAT(m.first_name, ' ', m.last_name) AS manager_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     LEFT JOIN companies c ON c.id = e.company_id
     LEFT JOIN working_schedules ws ON ws.id = e.schedule_id
     LEFT JOIN employees m ON m.id = e.manager_id
     WHERE e.id = ?`,
    [id]
  );
  return rows[0] ? toEmployee(rows[0]) : null;
}

export async function findByEmail(email: string): Promise<Employee | null> {
  const [rows] = await pool.execute<EmployeeRow[]>(
    `SELECT e.*,
            d.name AS department_name,
            c.name AS company_name,
            ws.name AS schedule_name,
            CONCAT(m.first_name, ' ', m.last_name) AS manager_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     LEFT JOIN companies c ON c.id = e.company_id
     LEFT JOIN working_schedules ws ON ws.id = e.schedule_id
     LEFT JOIN employees m ON m.id = e.manager_id
     WHERE e.work_email = ?`,
    [email]
  );
  return rows[0] ? toEmployee(rows[0]) : null;
}

export async function create(data: Record<string, unknown>): Promise<Employee> {
  const id     = crypto.randomUUID();
  const empNum = `EMP-${String(Math.floor(Math.random() * 90000) + 10000)}`;

  await pool.execute<ResultSetHeader>(
    `INSERT INTO employees
      (id, employee_number, first_name, last_name, work_email, phone, private_address,
       emergency_contact, emergency_contact_phone, job_title, job_position_id,
       department_id, manager_id, employment_type, company_id, location,
       schedule_id, hire_date, bank_account, iban, swift, status, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'active',?)`,
    [
      id, empNum,
      data.firstName, data.lastName, data.workEmail,
      data.phone ?? null, data.privateAddress ?? null,
      data.emergencyContact ?? null, data.emergencyContactPhone ?? null,
      data.jobTitle ?? null, data.jobPositionId ?? null,
      data.departmentId ?? null, data.managerId ?? null,
      data.employmentType, data.companyId ?? null, data.location ?? null,
      data.scheduleId ?? null, data.hireDate,
      data.bankAccount ?? null, data.iban ?? null, data.swift ?? null,
      data.createdBy ?? null,
    ] as any[]
  );

  return (await findById(id))!;
}

export async function update(id: string, data: Record<string, unknown>): Promise<Employee | null> {
  const allowed: Record<string, string> = {
    firstName: 'first_name', lastName: 'last_name', phone: 'phone',
    privateAddress: 'private_address', emergencyContact: 'emergency_contact',
    emergencyContactPhone: 'emergency_contact_phone', jobTitle: 'job_title',
    jobPositionId: 'job_position_id', departmentId: 'department_id',
    managerId: 'manager_id', employmentType: 'employment_type',
    companyId: 'company_id', location: 'location', scheduleId: 'schedule_id',
    hireDate: 'hire_date', bankAccount: 'bank_account', iban: 'iban',
    swift: 'swift', updatedBy: 'updated_by',
  };

  const sets: string[] = [];
  const params: any[]  = [];

  for (const [key, col] of Object.entries(allowed)) {
    if (key in data) {
      sets.push(`${col} = ?`);
      params.push(data[key] ?? null);
    }
  }

  if (!sets.length) return findById(id);

  params.push(id);
  await pool.execute<ResultSetHeader>(
    `UPDATE employees SET ${sets.join(', ')} WHERE id = ?`, params
  );

  return findById(id);
}

export async function archive(id: string, by?: string): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>(
    `UPDATE employees SET status = 'archived', archived_at = NOW(), archived_by = ? WHERE id = ?`,
    [by ?? null, id]
  );
  return res.affectedRows > 0;
}

export async function restore(id: string, by?: string): Promise<boolean> {
  const [res] = await pool.execute<ResultSetHeader>(
    `UPDATE employees SET status = 'active', archived_at = NULL, archived_by = NULL, updated_by = ? WHERE id = ?`,
    [by ?? null, id]
  );
  return res.affectedRows > 0;
}

export async function getSmartCounts(employeeId: string): Promise<SmartCounts> {
  const [cRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS contracts FROM contracts WHERE employee_id = ?', [employeeId]);
  const [aRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS attendance FROM attendance_records WHERE employee_id = ?', [employeeId]);
  const [tRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS timeOff FROM time_off_requests WHERE employee_id = ?', [employeeId]);
  const [alRows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) AS allocations FROM time_off_allocations WHERE employee_id = ?', [employeeId]);

  return {
    employeeId,
    contracts: Number((cRows[0] as any)?.contracts ?? 0),
    attendance: Number((aRows[0] as any)?.attendance ?? 0),
    timeOff: Number((tRows[0] as any)?.timeOff ?? 0),
    allocations: Number((alRows[0] as any)?.allocations ?? 0),
  };
}

export async function getLookups() {
  const [departments] = await pool.execute<RowDataPacket[]>(
    'SELECT id, company_id, code, name FROM departments WHERE is_active = 1 AND deleted_at IS NULL ORDER BY name ASC'
  );
  const [companies] = await pool.execute<RowDataPacket[]>(
    'SELECT id, code, name, currency_code FROM companies WHERE is_active = 1 AND deleted_at IS NULL ORDER BY name ASC'
  );
  const [schedules] = await pool.execute<RowDataPacket[]>(
    'SELECT id, name, company, timezone, weekly_hours FROM working_schedules WHERE is_active = 1 ORDER BY name ASC'
  );
  const [managers] = await pool.execute<RowDataPacket[]>(
    `SELECT e.id, e.first_name, e.last_name, e.job_title, e.employee_number, e.department_id, d.name AS department_name, e.company_id
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.status = 'active'
     ORDER BY e.first_name ASC, e.last_name ASC
     LIMIT 500`
  );

  return {
    departments: departments.map(d => ({
      id: d.id,
      companyId: d.company_id,
      code: d.code,
      name: d.name,
    })),
    companies: companies.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      currencyCode: c.currency_code,
    })),
    schedules: schedules.map(s => ({
      id: s.id,
      name: s.name,
      company: s.company,
      timezone: s.timezone,
      weeklyHours: Number(s.weekly_hours),
    })),
    managers: managers.map(m => ({
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      name: `${m.first_name} ${m.last_name}`,
      jobTitle: m.job_title ?? undefined,
      employeeNumber: m.employee_number ?? undefined,
      departmentId: m.department_id ?? undefined,
      departmentName: m.department_name ?? undefined,
      companyId: m.company_id ?? undefined,
    })),
  };
}
