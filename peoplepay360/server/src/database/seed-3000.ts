/**
 * PeoplePay360 — Large Demo Data Seeder
 *
 * Seeds 3,000 additional employees and connected HR/payroll data.
 * Designed as an extension of the existing reference seed file.
 *
 * Run from the server project:
 *   npx ts-node src/database/seed-3000.ts
 *
 * The script is idempotent for the generated records: running it again
 * updates/reuses the same deterministic IDs rather than creating duplicates.
 *
 * Reference:
 * - Existing reference seed: working schedules, salary structures/rules,
 *   time-off types, 8 demo employees/users/contracts and Jan/Feb 2026 payruns.
 * - PeoplePay360 requirements: Employee is the central hub; Contracts,
 *   Attendance, Time Off and Payroll feed the Dashboard.
 */

import pool from './connection/pool';

const TOTAL_EMPLOYEES = 3000;
const DASHBOARD_MONTHS = [
  { key: 'jun2026', start: '2026-06-01', end: '2026-06-30' },
  { key: 'jul2026', start: '2026-07-01', end: '2026-07-31' },
  { key: 'aug2026', start: '2026-08-01', end: '2026-08-31' },
  { key: 'sep2026', start: '2026-09-01', end: '2026-09-30' },
];

const ATTENDANCE_DAYS = DASHBOARD_MONTHS.flatMap(({ start }) =>
  Array.from({ length: 5 }, (_, index) => `${start.slice(0, 8)}${String(index + 1).padStart(2, '0')}`),
);

const IDS = {
  company: '6ead8c86-a96e-11f1-b2f6-3a217fae9be6',

  schedules: {
    standard40h: 'a0000000-0000-0000-0000-000000000001',
    partTime20h: 'a0000000-0000-0000-0000-000000000002',
    flexible35h: 'a0000000-0000-0000-0000-000000000003',
  },

  structures: {
    standard: 'd0000000-0000-0000-0000-000000000001',
    executive: 'd0000000-0000-0000-0000-000000000002',
  },

  timeOffTypes: {
    pto: 'g0000000-0000-0000-0000-000000000001',
    sick: 'g0000000-0000-0000-0000-000000000002',
    casual: 'g0000000-0000-0000-0000-000000000003',
    unpaid: 'g0000000-0000-0000-0000-000000000004',
  },

  payruns: {
    jun2026: 'h0000000-0000-0000-0000-000000000101',
    jul2026: 'h0000000-0000-0000-0000-000000000102',
    aug2026: 'h0000000-0000-0000-0000-000000000103',
    sep2026: 'h0000000-0000-0000-0000-000000000104',
  },

  // Prefixes are intentionally different from the reference seed IDs.
  prefixes: {
    employee: '30000000',
    contract: '40000000',
    attendance: '50000000',
    allocation: '60000000',
    request: '70000000',
    payslip: '80000000',
    line: '90000000',
  },
};

type Department = {
  id: string;
  code: string;
  name: string;
};

type EmployeeSeed = {
  id: string;
  number: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  employmentType: 'full_time' | 'part_time' | 'contractor';
  departmentId: string;
  departmentName: string;
  managerId: string | null;
  scheduleId: string;
  hireDate: string;
  location: string;
  wage: number;
  structureId: string;
  contractId: string;
};

function deterministicId(prefix: string, n: number): string {
  return `${prefix}-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function dateForEmployee(index: number): string {
  const year = 2021 + (index % 6);
  const month = String(1 + (index % 12)).padStart(2, '0');
  const day = String(1 + (index % 24)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildPhone(index: number): string {
  return `+91-900${String(index % 100000).padStart(5, '0')}`;
}

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Akash', 'Akshay', 'Aman', 'Amit', 'Ananya',
  'Anika', 'Anil', 'Anjali', 'Ankit', 'Anuj', 'Arjun', 'Arnav', 'Arpita',
  'Aryan', 'Ashish', 'Avani', 'Bhavya', 'Chetan', 'Deepak', 'Deepika',
  'Dev', 'Dhruv', 'Diya', 'Gaurav', 'Isha', 'Ishaan', 'Jatin', 'Karan',
  'Kavya', 'Kiran', 'Krishna', 'Manish', 'Meera', 'Mohit', 'Naina',
  'Neha', 'Nikhil', 'Nisha', 'Pallavi', 'Pooja', 'Pranav', 'Priya',
  'Rahul', 'Raj', 'Riya', 'Rohan', 'Rohit', 'Sahil', 'Sakshi', 'Sameer',
  'Sana', 'Sanjay', 'Shivam', 'Shreya', 'Sneha', 'Sonia', 'Tanvi',
  'Varun', 'Vikas', 'Vikram', 'Vivek', 'Yash', 'Zoya',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Verma', 'Gupta', 'Mehta', 'Shah',
  'Desai', 'Joshi', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Kapoor', 'Malhotra',
  'Bansal', 'Chopra', 'Agarwal', 'Saxena', 'Mishra', 'Pandey', 'Tiwari',
  'Sinha', 'Jain', 'Sethi', 'Arora', 'Khanna', 'Bhatia', 'Choudhary',
];

const JOBS = [
  { title: 'Software Engineer', min: 55000, max: 95000, structure: 'standard' },
  { title: 'Senior Software Engineer', min: 85000, max: 135000, structure: 'standard' },
  { title: 'Frontend Developer', min: 60000, max: 100000, structure: 'standard' },
  { title: 'Backend Developer', min: 65000, max: 105000, structure: 'standard' },
  { title: 'QA Engineer', min: 50000, max: 85000, structure: 'standard' },
  { title: 'Product Designer', min: 55000, max: 90000, structure: 'standard' },
  { title: 'HR Executive', min: 45000, max: 75000, structure: 'standard' },
  { title: 'Recruiter', min: 40000, max: 70000, structure: 'standard' },
  { title: 'Payroll Specialist', min: 50000, max: 85000, structure: 'standard' },
  { title: 'Finance Analyst', min: 55000, max: 95000, structure: 'standard' },
  { title: 'Sales Executive', min: 45000, max: 85000, structure: 'standard' },
  { title: 'Operations Executive', min: 40000, max: 75000, structure: 'standard' },
  { title: 'Engineering Manager', min: 120000, max: 180000, structure: 'executive' },
  { title: 'Product Manager', min: 110000, max: 170000, structure: 'executive' },
  { title: 'HR Manager', min: 100000, max: 160000, structure: 'executive' },
];

const DEPARTMENT_DEFS = [
  { code: 'ENG', name: 'Engineering' },
  { code: 'HR', name: 'Human Resources' },
  { code: 'FIN', name: 'Finance & Payroll' },
  { code: 'SALES', name: 'Sales' },
  { code: 'OPS', name: 'Operations' },
  { code: 'DESIGN', name: 'Product Design' },
];

async function getDepartments(conn: any): Promise<Department[]> {
  const departments: Department[] = [];

  for (let i = 0; i < DEPARTMENT_DEFS.length; i++) {
    const def = DEPARTMENT_DEFS[i];

    const [existing] = await conn.execute(
      `SELECT id, code, name
       FROM departments
       WHERE company_id = ? AND code = ? AND deleted_at IS NULL
       LIMIT 1`,
      [IDS.company, def.code],
    );

    if (existing.length > 0) {
      departments.push(existing[0] as Department);
      continue;
    }

    const id = deterministicId('20000000', i + 1);

    await conn.execute(
      `INSERT INTO departments
        (id, company_id, code, name, is_active)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         company_id = VALUES(company_id),
         code = VALUES(code),
         name = VALUES(name),
         is_active = 1,
         deleted_at = NULL`,
      [id, IDS.company, def.code, def.name],
    );

    departments.push({ id, code: def.code, name: def.name });
  }

  return departments;
}

function makeEmployees(departments: Department[]): EmployeeSeed[] {
  const employees: EmployeeSeed[] = [];

  for (let i = 1; i <= TOTAL_EMPLOYEES; i++) {
    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor((i - 1) / FIRST_NAMES.length) % LAST_NAMES.length];
    const job = JOBS[(i - 1) % JOBS.length];
    const department = departments[(i - 1) % departments.length];

    // 70% full-time, 20% part-time, 10% contractor.
    const employmentType =
      i % 10 < 7 ? 'full_time' :
      i % 10 < 9 ? 'part_time' :
      'contractor';

    const scheduleId =
      employmentType === 'part_time'
        ? IDS.schedules.partTime20h
        : employmentType === 'contractor'
          ? IDS.schedules.flexible35h
          : IDS.schedules.standard40h;

    const range = job.max - job.min;
    const wage = money(job.min + ((i * 137) % (range * 100)) / 100);

    const id = deterministicId(IDS.prefixes.employee, i);
    const contractId = deterministicId(IDS.prefixes.contract, i);

    // First 12 generated employees act as managers. Remaining employees
    // are distributed beneath a deterministic manager.
    let managerId: string | null = null;
    if (i > 12) {
      const managerIndex = ((i - 13) % 12) + 1;
      managerId = deterministicId(IDS.prefixes.employee, managerIndex);
    }

    employees.push({
      id,
      number: `EMP-${String(10000 + i).padStart(5, '0')}`,
      firstName,
      lastName,
      email: `employee${String(i).padStart(4, '0')}@company.com`,
      phone: buildPhone(i),
      jobTitle: job.title,
      employmentType,
      departmentId: department.id,
      departmentName: department.name,
      managerId,
      scheduleId,
      hireDate: dateForEmployee(i),
      location: ['Mumbai, India', 'Delhi, India', 'Bengaluru, India', 'Pune, India', 'Hyderabad, India', 'Ahmedabad, India'][i % 6],
      wage,
      structureId: job.structure === 'executive'
        ? IDS.structures.executive
        : IDS.structures.standard,
      contractId,
    });
  }

  return employees;
}

async function insertEmployees(conn: any, employees: EmployeeSeed[]) {
  const sql = `
    INSERT INTO employees
      (id, employee_number, first_name, last_name, work_email, phone,
       job_title, department_id, manager_id, employment_type, company_id,
       location, schedule_id, hire_date, current_contract_id, bank_account,
       iban, swift, status)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      employee_number = VALUES(employee_number),
      first_name = VALUES(first_name),
      last_name = VALUES(last_name),
      work_email = VALUES(work_email),
      phone = VALUES(phone),
      job_title = VALUES(job_title),
      department_id = VALUES(department_id),
      manager_id = VALUES(manager_id),
      employment_type = VALUES(employment_type),
      company_id = VALUES(company_id),
      location = VALUES(location),
      schedule_id = VALUES(schedule_id),
      hire_date = VALUES(hire_date),
      current_contract_id = VALUES(current_contract_id),
      bank_account = VALUES(bank_account),
      iban = VALUES(iban),
      swift = VALUES(swift),
      status = 'active'
  `;

  const BATCH = 500;

  for (let start = 0; start < employees.length; start += BATCH) {
    const batch = employees.slice(start, start + BATCH);

    const values = batch.map(e => [
      e.id,
      e.number,
      e.firstName,
      e.lastName,
      e.email,
      e.phone,
      e.jobTitle,
      e.departmentId,
      e.managerId,
      e.employmentType,
      IDS.company,
      e.location,
      e.scheduleId,
      e.hireDate,
      e.contractId,
      // Intentionally leave bank details missing for a visible subset so
      // payroll warning/alert widgets have realistic data.
      e.id.endsWith('0000') ? null : `BANK-${String(start + 1).padStart(5, '0')}`,
      e.id.endsWith('0000') ? null : `IN00PP360${String(start + 1).padStart(8, '0')}`,
      e.id.endsWith('0000') ? null : 'PP360INR',
      'active',
    ]);

    await conn.query(sql, [values]);
    console.log(`  ✓ Employees ${start + 1}-${Math.min(start + BATCH, employees.length)}`);
  }
}

async function insertContracts(conn: any, employees: EmployeeSeed[]) {
  const sql = `
    INSERT INTO contracts
      (id, employee_id, contract_ref, status, department, job_position,
       wage, start_date, schedule_id, structure_id)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      employee_id = VALUES(employee_id),
      contract_ref = VALUES(contract_ref),
      status = 'Running',
      department = VALUES(department),
      job_position = VALUES(job_position),
      wage = VALUES(wage),
      start_date = VALUES(start_date),
      schedule_id = VALUES(schedule_id),
      structure_id = VALUES(structure_id)
  `;

  const values = employees.map((e, i) => [
    e.contractId,
    e.id,
    `CNT-2026-${String(i + 1).padStart(5, '0')}`,
    'Running',
    e.departmentName,
    e.jobTitle,
    e.wage,
    e.hireDate,
    e.scheduleId,
    e.structureId,
  ]);

  for (let start = 0; start < values.length; start += 500) {
    await conn.query(sql, [values.slice(start, start + 500)]);
  }

  console.log('  ✓ Contracts seeded');
}

async function insertAttendance(conn: any, employees: EmployeeSeed[]) {
  const rows: any[] = [];
  let n = 1;

  // Rebuild only generated attendance so reruns cannot retain stale month data.
  for (let start = 0; start < employees.length; start += 500) {
    const batch = employees.slice(start, start + 500);
    const placeholders = batch.map(() => '?').join(', ');
    await conn.execute(
      `DELETE FROM attendance_records WHERE employee_id IN (${placeholders})`,
      batch.map((employee) => employee.id),
    );
  }

  for (let d = 0; d < ATTENDANCE_DAYS.length; d++) {
    for (let i = 0; i < employees.length; i++) {
      const e = employees[i];

      // Deterministic distribution:
      // 84% Present, 7% Late, 3% Overtime, 3% Absent, 3% missing checkout.
      const bucket = (i * 17 + d * 13) % 100;
      const id = deterministicId(IDS.prefixes.attendance, n++);

      if (bucket < 3) {
        rows.push([
          id, e.id, ATTENDANCE_DAYS[d],
          `${ATTENDANCE_DAYS[d]} 09:00:00`,
          `${ATTENDANCE_DAYS[d]} 13:00:00`,
          240, 0, 'Absent', 0,
        ]);
      } else if (bucket < 6) {
        rows.push([
          id, e.id, ATTENDANCE_DAYS[d],
          `${ATTENDANCE_DAYS[d]} 09:20:00`,
          `${ATTENDANCE_DAYS[d]} 18:00:00`,
          460, 0, 'Late', 0,
        ]);
      } else if (bucket < 9) {
        rows.push([
          id, e.id, ATTENDANCE_DAYS[d],
          `${ATTENDANCE_DAYS[d]} 09:00:00`,
          `${ATTENDANCE_DAYS[d]} 20:00:00`,
          660, 120, 'Overtime', 0,
        ]);
      } else if (bucket < 12) {
        rows.push([
          id, e.id, ATTENDANCE_DAYS[d],
          `${ATTENDANCE_DAYS[d]} 09:00:00`,
          null,
          null, 0, 'Present', 0,
        ]);
      } else {
        rows.push([
          id, e.id, ATTENDANCE_DAYS[d],
          `${ATTENDANCE_DAYS[d]} 09:00:00`,
          `${ATTENDANCE_DAYS[d]} 18:00:00`,
          480, 0, 'Present', 0,
        ]);
      }
    }
  }

  const sql = `
    INSERT INTO attendance_records
      (id, employee_id, date, check_in, check_out, worked_minutes,
       overtime_minutes, status, is_manual_entry)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      check_in = VALUES(check_in),
      check_out = VALUES(check_out),
      worked_minutes = VALUES(worked_minutes),
      overtime_minutes = VALUES(overtime_minutes),
      status = VALUES(status),
      is_manual_entry = VALUES(is_manual_entry)
  `;

  for (let start = 0; start < rows.length; start += 1000) {
    await conn.query(sql, [rows.slice(start, start + 1000)]);
  }

  console.log(`  ✓ Attendance seeded (${rows.length} records)`);
}

async function insertAllocations(conn: any, employees: EmployeeSeed[]) {
  const rows: any[] = [];
  let n = 1;

  for (const e of employees) {
    const types = [
      [IDS.timeOffTypes.pto, 20, 2 + (n % 5)],
      [IDS.timeOffTypes.sick, 10, n % 3],
      [IDS.timeOffTypes.casual, 7, n % 2],
    ];

    for (const [typeId, total, used] of types) {
      rows.push([
        deterministicId(IDS.prefixes.allocation, n++),
        e.id,
        typeId,
        2026,
        total,
        Math.min(Number(used), Number(total)),
        '2026-01-01',
        '2026-12-31',
        'c0000000-0000-0000-0000-000000000002',
        'Approved',
      ]);
    }
  }

  const sql = `
    INSERT INTO time_off_allocations
      (id, employee_id, type_id, year, total_days, used_days,
       validity_start, validity_end, approver_id, status)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      total_days = VALUES(total_days),
      used_days = VALUES(used_days),
      validity_start = VALUES(validity_start),
      validity_end = VALUES(validity_end),
      approver_id = VALUES(approver_id),
      status = 'Approved'
  `;

  for (let start = 0; start < rows.length; start += 1000) {
    await conn.query(sql, [rows.slice(start, start + 1000)]);
  }

  console.log(`  ✓ Time-off allocations seeded (${rows.length})`);
}

async function insertTimeOffRequests(conn: any, employees: EmployeeSeed[]) {
  const rows: any[] = [];

  for (let i = 0; i < employees.length; i++) {
    const e = employees[i];
    const status =
      i % 10 < 6 ? 'Approved' :
      i % 10 < 8 ? 'Confirmed' :
      i % 10 === 8 ? 'Refused' :
      'Draft';

    const typeId =
      i % 3 === 0 ? IDS.timeOffTypes.pto :
      i % 3 === 1 ? IDS.timeOffTypes.sick :
      IDS.timeOffTypes.casual;

    const month = DASHBOARD_MONTHS[i % DASHBOARD_MONTHS.length];
    const day = String(1 + (i % 20)).padStart(2, '0');

    rows.push([
      deterministicId(IDS.prefixes.request, i + 1),
      e.id,
      typeId,
      `${month.start.slice(0, 8)}${day}`,
      `${month.start.slice(0, 8)}${day}`,
      1,
      status,
      status === 'Approved'
        ? 'Planned leave'
        : status === 'Confirmed'
          ? 'Awaiting HR approval'
          : status === 'Refused'
            ? 'Insufficient operational coverage'
            : 'Draft leave request',
    ]);
  }

  const sql = `
    INSERT INTO time_off_requests
      (id, employee_id, type_id, start_date, end_date, days, status, reason)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      start_date = VALUES(start_date),
      end_date = VALUES(end_date),
      days = VALUES(days),
      status = VALUES(status),
      reason = VALUES(reason)
  `;

  for (let start = 0; start < rows.length; start += 1000) {
    await conn.query(sql, [rows.slice(start, start + 1000)]);
  }

  console.log(`  ✓ Time-off requests seeded (${rows.length})`);
}

function payslipAmounts(e: EmployeeSeed) {
  const gross = money(e.wage);
  const basic = money(gross * 0.60);
  const hra = money(gross * 0.20);
  const allowance = money(gross - basic - hra);
  const pfRate = e.structureId === IDS.structures.executive ? 0.12 : 0.12;
  const tdsRate = e.structureId === IDS.structures.executive ? 0.20 : 0.10;
  const pf = money(gross * pfRate);
  const tds = money(gross * tdsRate);
  const deductions = money(pf + tds);
  const net = money(gross - deductions);

  return { gross, basic, hra, allowance, pf, tds, deductions, net };
}

async function insertPayruns(conn: any) {
  const payruns = DASHBOARD_MONTHS.map((month) => ({
    id: IDS.payruns[month.key as keyof typeof IDS.payruns],
    name: `Payrun - ${month.key.slice(0, 3).toUpperCase()} 2026`,
    periodStart: month.start,
    periodEnd: month.end,
    status: 'Paid',
    paidAt: `${month.end} 18:00:00`,
    paidBy: 'c0000000-0000-0000-0000-000000000003',
  }));

  const sql = `
    INSERT INTO payruns
      (id, name, period_start, period_end, structure_id, status, paid_at, paid_by, company_id)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      period_start = VALUES(period_start),
      period_end = VALUES(period_end),
      structure_id = VALUES(structure_id),
      status = VALUES(status),
      paid_at = VALUES(paid_at),
      paid_by = VALUES(paid_by),
      company_id = VALUES(company_id)
  `;

  await conn.query(sql, [payruns.map((payrun) => [
    payrun.id,
    payrun.name,
    payrun.periodStart,
    payrun.periodEnd,
    IDS.structures.standard,
    payrun.status,
    payrun.paidAt,
    payrun.paidBy,
    IDS.company,
  ])]);

  console.log(`  ✓ Payruns seeded (${payruns.length})`);
}

async function insertPayslips(conn: any, employees: EmployeeSeed[]) {
  const payslips: any[] = [];
  const lines: any[] = [];
  let ps = 1;
  let line = 1;

  const payruns = [
    ...DASHBOARD_MONTHS.map((month) => ({
      id: IDS.payruns[month.key as keyof typeof IDS.payruns],
      status: 'Paid',
    })),
  ];

  for (const pr of payruns) {
    for (const e of employees) {
      const a = payslipAmounts(e);
      const payslipId = deterministicId(IDS.prefixes.payslip, ps++);

      // 3% of generated employees intentionally have missing bank details,
      // producing realistic payroll warning data.
      const warningCodes =
        e.id.endsWith('0000') ? JSON.stringify(['MISSING_BANK_DETAILS']) : '[]';

      payslips.push([
        payslipId,
        pr.id,
        e.id,
        e.contractId,
        a.gross,
        a.deductions,
        a.net,
        22.00,
        pr.status,
        warningCodes,
      ]);

      const lineRows = [
        ['BASIC', 'Basic Salary', 'Basic', a.basic, 1],
        ['HRA', 'House Rent Allowance', 'Allowance', a.hra, 2],
        ['SPECIAL', 'Special Allowance', 'Allowance', a.allowance, 3],
        ['GROSS', 'Gross Salary', 'Gross', a.gross, 4],
        ['PF', 'Provident Fund', 'Deduction', a.pf, 5],
        ['TDS', 'Tax Deducted at Source', 'Deduction', a.tds, 6],
        ['NET', 'Net Salary', 'Net', a.net, 7],
      ];

      for (const [code, name, category, amount, sequence] of lineRows) {
        lines.push([
          deterministicId(IDS.prefixes.line, line++),
          payslipId,
          code,
          name,
          category,
          amount,
          sequence,
        ]);
      }
    }
  }

  const payslipSql = `
    INSERT INTO payslips
      (id, payrun_id, employee_id, contract_id, gross, deductions, net,
       worked_days, status, warning_codes)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      payrun_id = VALUES(payrun_id),
      contract_id = VALUES(contract_id),
      gross = VALUES(gross),
      deductions = VALUES(deductions),
      net = VALUES(net),
      worked_days = VALUES(worked_days),
      status = VALUES(status),
      warning_codes = VALUES(warning_codes)
  `;

  for (let start = 0; start < payslips.length; start += 1000) {
    await conn.query(payslipSql, [payslips.slice(start, start + 1000)]);
  }

  const lineSql = `
    INSERT INTO payslip_lines
      (id, payslip_id, rule_code, rule_name, category, amount, sequence)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      rule_name = VALUES(rule_name),
      category = VALUES(category),
      amount = VALUES(amount),
      sequence = VALUES(sequence)
  `;

  for (let start = 0; start < lines.length; start += 2000) {
    await conn.query(lineSql, [lines.slice(start, start + 2000)]);
  }

  console.log(`  ✓ Payslips seeded (${payslips.length})`);
  console.log(`  ✓ Payslip lines seeded (${lines.length})`);
}

async function updatePayrunTotals(conn: any) {
  await conn.execute(
    `UPDATE payruns
     SET company_id = ?
     WHERE id IN (?, ?, ?, ?)
       AND (company_id IS NULL OR company_id <> ?)`,
    [IDS.company, IDS.payruns.jun2026, IDS.payruns.jul2026, IDS.payruns.aug2026, IDS.payruns.sep2026, IDS.company],
  );

  for (const payrunId of [IDS.payruns.jun2026, IDS.payruns.jul2026, IDS.payruns.aug2026, IDS.payruns.sep2026]) {
    await conn.execute(
      `UPDATE payruns r
       JOIN (
         SELECT
           payrun_id,
           COUNT(*) AS employee_count,
           COALESCE(SUM(gross), 0) AS total_gross,
           COALESCE(SUM(net), 0) AS total_net,
           COALESCE(SUM(warning_count), 0) AS warning_count
         FROM payslips
         WHERE payrun_id = ?
         GROUP BY payrun_id
       ) x ON x.payrun_id = r.id
       SET r.employee_count = x.employee_count,
           r.total_gross = x.total_gross,
           r.total_net = x.total_net,
           r.warning_count = x.warning_count
       WHERE r.id = ?`,
      [payrunId, payrunId],
    );
  }

  console.log('  ✓ Payrun company IDs and totals refreshed');
}

async function verify(conn: any) {
  const [rows] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM employees WHERE company_id = ?) AS employees,
      (SELECT COUNT(*) FROM contracts c JOIN employees e ON e.id = c.employee_id WHERE e.company_id = ?) AS contracts,
      (SELECT COUNT(*) FROM attendance_records a JOIN employees e ON e.id = a.employee_id WHERE e.company_id = ?) AS attendance,
      (SELECT COUNT(*) FROM time_off_allocations a JOIN employees e ON e.id = a.employee_id WHERE e.company_id = ?) AS allocations,
      (SELECT COUNT(*) FROM time_off_requests r JOIN employees e ON e.id = r.employee_id WHERE e.company_id = ?) AS requests,
      (SELECT COUNT(*) FROM payslips p JOIN employees e ON e.id = p.employee_id WHERE e.company_id = ?) AS payslips
  `, [
    IDS.company, IDS.company, IDS.company,
    IDS.company, IDS.company, IDS.company,
  ]);

  console.table(rows);
}

async function seed() {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    console.log('\n========================================================');
    console.log(' PeoplePay360 — 3,000 Employee Demo Data Seeder');
    console.log('========================================================');

    const [companyRows] = await conn.execute(
      `SELECT id, name FROM companies WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [IDS.company],
    );

    if (!Array.isArray(companyRows) || companyRows.length === 0) {
      throw new Error(
        `Company ${IDS.company} was not found. Run the reference seed first, or update IDS.company.`,
      );
    }

    const departments = await getDepartments(conn);
    console.log(`  ✓ Departments ready (${departments.length})`);

    const employees = makeEmployees(departments);

    await insertEmployees(conn, employees);
    await insertContracts(conn, employees);
    await insertAttendance(conn, employees);
    await insertAllocations(conn, employees);
    await insertTimeOffRequests(conn, employees);
    await insertPayruns(conn);
    await insertPayslips(conn, employees);
    await updatePayrunTotals(conn);

    await conn.commit();

    console.log('\n========================================================');
    console.log(' ✓ LARGE DATA SEED COMPLETED SUCCESSFULLY');
    console.log('========================================================');
    await verify(conn);
    console.log('\nGenerated dataset:');
    console.log(`  Employees:       ${TOTAL_EMPLOYEES}`);
    console.log(`  Contracts:       ${TOTAL_EMPLOYEES}`);
    console.log(`  Attendance:      ${TOTAL_EMPLOYEES * ATTENDANCE_DAYS.length}`);
    console.log(`  Allocations:     ${TOTAL_EMPLOYEES * 3}`);
    console.log(`  Time-off:        ${TOTAL_EMPLOYEES}`);
    console.log(`  Payslips:        ${TOTAL_EMPLOYEES * DASHBOARD_MONTHS.length}`);
    console.log(`  Payslip lines:   ${TOTAL_EMPLOYEES * DASHBOARD_MONTHS.length * 7}`);
    console.log('========================================================\n');
  } catch (err) {
    await conn.rollback();
    console.error('\nSeed failed. Transaction rolled back.');
    console.error(err);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
