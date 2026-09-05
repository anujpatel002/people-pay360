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
      `(first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name,' ',last_name) LIKE ?
       OR work_email LIKE ? OR employee_number LIKE ? OR job_title LIKE ?)`
    );
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like);
  }
  if (departmentId)   { conditions.push('department_id = ?');   params.push(departmentId); }
  if (status)         { conditions.push('status = ?');           params.push(status); }
  if (employmentType) { conditions.push('employment_type = ?');  params.push(employmentType); }
  if (jobPositionId)  { conditions.push('job_position_id = ?');  params.push(jobPositionId); }
  if (managerId)      { conditions.push('manager_id = ?');       params.push(managerId); }
  if (companyId)      { conditions.push('company_id = ?');       params.push(companyId); }
  if (location)       { conditions.push('location = ?');         params.push(location); }
  if (scheduleId)     { conditions.push('schedule_id = ?');      params.push(scheduleId); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const col   = SORTABLE.has(toSnake(sortBy)) ? toSnake(sortBy) : 'last_name';
  const dir   = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const [[{ total }]] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM employees ${where}`, params
  );

  const [rows] = await pool.execute<EmployeeRow[]>(
    `SELECT * FROM employees ${where} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { data: rows.map(toEmployee), total, page, limit };
}

export async function findById(id: string): Promise<Employee | null> {
  const [rows] = await pool.execute<EmployeeRow[]>(
    'SELECT * FROM employees WHERE id = ?', [id]
  );
  return rows[0] ? toEmployee(rows[0]) : null;
}

export async function findByEmail(email: string): Promise<Employee | null> {
  const [rows] = await pool.execute<EmployeeRow[]>(
    'SELECT * FROM employees WHERE work_email = ?', [email]
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

export async function update(id: string, data: Record<string, unknown>): Promise<Employee> {
  const fieldMap: Record<string, string> = {
    firstName: 'first_name', lastName: 'last_name', workEmail: 'work_email',
    phone: 'phone', privateAddress: 'private_address',
    emergencyContact: 'emergency_contact', emergencyContactPhone: 'emergency_contact_phone',
    jobTitle: 'job_title', jobPositionId: 'job_position_id',
    departmentId: 'department_id', managerId: 'manager_id',
    employmentType: 'employment_type', companyId: 'company_id',
    location: 'location', scheduleId: 'schedule_id', hireDate: 'hire_date',
    bankAccount: 'bank_account', iban: 'iban', swift: 'swift',
    updatedBy: 'updated_by',
  };

  const sets: string[] = [];
  const params: any[]  = [];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data) { sets.push(`${col} = ?`); params.push(data[key] ?? null); }
  }

  if (!sets.length) return (await findById(id))!;

  params.push(id);
  await pool.execute<ResultSetHeader>(
    `UPDATE employees SET ${sets.join(', ')} WHERE id = ?`, params
  );

  return (await findById(id))!;
}

export async function softArchive(id: string, archivedBy: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE employees SET status = 'archived', archived_at = NOW(), archived_by = ? WHERE id = ?`,
    [archivedBy, id]
  );
}

export async function restore(id: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    `UPDATE employees SET status = 'active', archived_at = NULL, archived_by = NULL WHERE id = ?`,
    [id]
  );
}

export async function countRelated(id: string): Promise<SmartCounts> {
  const [[row]] = await pool.execute<(RowDataPacket & {
    contracts: number; attendance: number; timeOff: number; allocations: number;
  })[]>(
    `SELECT
       (SELECT COUNT(*) FROM contracts            WHERE employee_id = ?) AS contracts,
       (SELECT COUNT(*) FROM attendance_records   WHERE employee_id = ?) AS attendance,
       (SELECT COUNT(*) FROM time_off_requests    WHERE employee_id = ?) AS timeOff,
       (SELECT COUNT(*) FROM time_off_allocations WHERE employee_id = ?) AS allocations`,
    [id, id, id, id]
  );

  return {
    employeeId:  id,
    contracts:   row.contracts,
    attendance:  row.attendance,
    timeOff:     row.timeOff,
    allocations: row.allocations,
  };
}
