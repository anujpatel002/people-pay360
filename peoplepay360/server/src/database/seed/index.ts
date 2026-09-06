import pool from '../../database/connection/pool';
import { hashPassword } from '../../modules/auth/services/password.service';

const IDS = {
  schedules: {
    standard40h: 'a0000000-0000-0000-0000-000000000001',
    partTime20h: 'a0000000-0000-0000-0000-000000000002',
    flexible35h: 'a0000000-0000-0000-0000-000000000003',
  },
  structures: {
    standard:  'd0000000-0000-0000-0000-000000000001',
    executive: 'd0000000-0000-0000-0000-000000000002',
  },
  emp: {
    admin:        'b0000000-0000-0000-0000-000000000001',
    hrManager:    'b0000000-0000-0000-0000-000000000002',
    hrPayrollMgr: 'b0000000-0000-0000-0000-000000000003',
    hrPayrollUser:'b0000000-0000-0000-0000-000000000004',
    devLead:      'b0000000-0000-0000-0000-000000000005',
    devFrontend:  'b0000000-0000-0000-0000-000000000006',
    qaEngineer:   'b0000000-0000-0000-0000-000000000007',
    designer:     'b0000000-0000-0000-0000-000000000008',
  },
  user: {
    admin:        'c0000000-0000-0000-0000-000000000001',
    hrManager:    'c0000000-0000-0000-0000-000000000002',
    hrPayrollMgr: 'c0000000-0000-0000-0000-000000000003',
    hrPayrollUser:'c0000000-0000-0000-0000-000000000004',
    devLead:      'c0000000-0000-0000-0000-000000000005',
    devFrontend:  'c0000000-0000-0000-0000-000000000006',
    qaEngineer:   'c0000000-0000-0000-0000-000000000007',
    designer:     'c0000000-0000-0000-0000-000000000008',
  },
  contracts: {
    admin:        'f0000000-0000-0000-0000-000000000001',
    hrManager:    'f0000000-0000-0000-0000-000000000002',
    hrPayrollMgr: 'f0000000-0000-0000-0000-000000000003',
    hrPayrollUser:'f0000000-0000-0000-0000-000000000004',
    devLead:      'f0000000-0000-0000-0000-000000000005',
    devFrontend:  'f0000000-0000-0000-0000-000000000006',
    qaEngineer:   'f0000000-0000-0000-0000-000000000007',
    designer:     'f0000000-0000-0000-0000-000000000008',
  },
  timeOffTypes: {
    pto:    'g0000000-0000-0000-0000-000000000001',
    sick:   'g0000000-0000-0000-0000-000000000002',
    casual: 'g0000000-0000-0000-0000-000000000003',
    unpaid: 'g0000000-0000-0000-0000-000000000004',
  },
  payruns: {
    jan2026: 'h0000000-0000-0000-0000-000000000001',
    feb2026: 'h0000000-0000-0000-0000-000000000002',
  },
  companies: {
    primary:   '6ead8c86-a96e-11f1-b2f6-3a217fae9be6',
    technova:  '7fa91b97-b07f-11f1-c3a7-4b328abf0cf7',
    acmeGlobal:'8ab02c08-c180-11f1-d4b8-5c439bcf1da8',
  },
  departments: {
    engineering: '20000000-0000-0000-0000-000000000001',
    hr:          '20000000-0000-0000-0000-000000000002',
    finance:     '20000000-0000-0000-0000-000000000003',
    sales:       '20000000-0000-0000-0000-000000000004',
    operations:  '20000000-0000-0000-0000-000000000005',
    design:      '20000000-0000-0000-0000-000000000006',
  },
};

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    console.log('Seeding database tables...');

    // 0. Companies & Departments
    const companies = [
      { id: IDS.companies.primary, code: 'PEOPLEPAY360', name: 'PeoplePay360 Inc.', currency: 'INR' },
      { id: IDS.companies.technova, code: 'TECHNOVA', name: 'TechNova Solutions Ltd.', currency: 'USD' },
      { id: IDS.companies.acmeGlobal, code: 'ACME_GLOBAL', name: 'Acme Global Enterprises', currency: 'EUR' },
    ];
    for (const c of companies) {
      await conn.execute(`
        INSERT INTO companies (id, code, name, currency_code, is_active)
        VALUES (?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE name = VALUES(name), currency_code = VALUES(currency_code), is_active = 1
      `, [c.id, c.code, c.name, c.currency]);
    }

    const departments = [
      { id: IDS.departments.engineering, companyId: IDS.companies.primary, code: 'ENG', name: 'Engineering' },
      { id: IDS.departments.hr, companyId: IDS.companies.primary, code: 'HR', name: 'Human Resources' },
      { id: IDS.departments.finance, companyId: IDS.companies.primary, code: 'FIN', name: 'Finance & Payroll' },
      { id: IDS.departments.sales, companyId: IDS.companies.primary, code: 'SALES', name: 'Sales' },
      { id: IDS.departments.operations, companyId: IDS.companies.primary, code: 'OPS', name: 'Operations' },
      { id: IDS.departments.design, companyId: IDS.companies.primary, code: 'DESIGN', name: 'Product Design' },
    ];
    for (const d of departments) {
      await conn.execute(`
        INSERT INTO departments (id, company_id, code, name, is_active)
        VALUES (?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE name = VALUES(name), company_id = VALUES(company_id), is_active = 1
      `, [d.id, d.companyId, d.code, d.name]);
    }
    console.log('  ✓ Companies and departments seeded');

    // 1. Working schedules
    const schedules = [
      {
        id: IDS.schedules.standard40h,
        name: 'Standard 40h',
        company: 'Acme Corp',
        timezone: 'UTC',
        weeklyHours: 40.00,
        days: JSON.stringify([
          { day: 'monday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
          { day: 'tuesday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
          { day: 'wednesday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
          { day: 'thursday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
          { day: 'friday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
          { day: 'saturday', active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
          { day: 'sunday', active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
        ]),
      },
      {
        id: IDS.schedules.partTime20h,
        name: 'Part-time 20h',
        company: 'Acme Corp',
        timezone: 'UTC',
        weeklyHours: 20.00,
        days: JSON.stringify([
          { day: 'monday', active: true, start: '09:00', end: '13:00', breakMinutes: 0 },
          { day: 'tuesday', active: true, start: '09:00', end: '13:00', breakMinutes: 0 },
          { day: 'wednesday', active: true, start: '09:00', end: '13:00', breakMinutes: 0 },
          { day: 'thursday', active: true, start: '09:00', end: '13:00', breakMinutes: 0 },
          { day: 'friday', active: true, start: '09:00', end: '13:00', breakMinutes: 0 },
          { day: 'saturday', active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
          { day: 'sunday', active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
        ]),
      },
      {
        id: IDS.schedules.flexible35h,
        name: 'Flexible 35h',
        company: 'Acme Corp',
        timezone: 'UTC',
        weeklyHours: 35.00,
        days: JSON.stringify([
          { day: 'monday', active: true, start: '09:00', end: '17:00', breakMinutes: 60 },
          { day: 'tuesday', active: true, start: '09:00', end: '17:00', breakMinutes: 60 },
          { day: 'wednesday', active: true, start: '09:00', end: '17:00', breakMinutes: 60 },
          { day: 'thursday', active: true, start: '09:00', end: '17:00', breakMinutes: 60 },
          { day: 'friday', active: true, start: '09:00', end: '17:00', breakMinutes: 60 },
          { day: 'saturday', active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
          { day: 'sunday', active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
        ]),
      },
    ];

    for (const s of schedules) {
      await conn.execute(`
        INSERT INTO working_schedules (id, name, company, timezone, weekly_hours, days, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          company = VALUES(company),
          timezone = VALUES(timezone),
          weekly_hours = VALUES(weekly_hours),
          days = VALUES(days),
          is_active = 1
      `, [s.id, s.name, s.company, s.timezone, s.weeklyHours, s.days]);
    }
    console.log('  ✓ Working schedules seeded');

    // 2. Salary structures
    const structures = [
      { id: IDS.structures.standard, name: 'Regular Salary Structure' },
      { id: IDS.structures.executive, name: 'Executive Salary Structure' },
    ];

    for (const str of structures) {
      await conn.execute(`
        INSERT INTO salary_structures (id, name, is_active)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = 1
      `, [str.id, str.name]);
    }
    console.log('  ✓ Salary structures seeded');

    // 3. Salary rules
    const salaryRules = [
      // Standard Structure Rules
      { id: 'e0000000-0000-0000-0000-000000000001', structureId: IDS.structures.standard, code: 'BASIC', name: 'Basic Salary', category: 'Basic', seq: 1, method: 'fixed_amount', amount: 50000, pct: null, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000002', structureId: IDS.structures.standard, code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', seq: 2, method: 'percentage_of_gross', amount: null, pct: 40.00, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000003', structureId: IDS.structures.standard, code: 'CONVEYANCE', name: 'Conveyance Allowance', category: 'Allowance', seq: 3, method: 'fixed_amount', amount: 3000, pct: null, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000004', structureId: IDS.structures.standard, code: 'SPECIAL', name: 'Special Allowance', category: 'Allowance', seq: 4, method: 'fixed_amount', amount: 5000, pct: null, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000005', structureId: IDS.structures.standard, code: 'GROSS', name: 'Gross Salary', category: 'Gross', seq: 5, method: 'formula', amount: null, pct: null, formula: 'BASIC + HRA + CONVEYANCE + SPECIAL' },
      { id: 'e0000000-0000-0000-0000-000000000006', structureId: IDS.structures.standard, code: 'PF', name: 'Provident Fund', category: 'Deduction', seq: 6, method: 'percentage_of_gross', amount: null, pct: 12.00, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000007', structureId: IDS.structures.standard, code: 'TDS', name: 'Tax Deducted at Source', category: 'Deduction', seq: 7, method: 'percentage_of_gross', amount: null, pct: 10.00, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000008', structureId: IDS.structures.standard, code: 'NET', name: 'Net Salary', category: 'Net', seq: 8, method: 'formula', amount: null, pct: null, formula: 'GROSS - PF - TDS' },

      // Executive Structure Rules
      { id: 'e0000000-0000-0000-0000-000000000009', structureId: IDS.structures.executive, code: 'BASIC', name: 'Executive Basic', category: 'Basic', seq: 1, method: 'fixed_amount', amount: 100000, pct: null, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000010', structureId: IDS.structures.executive, code: 'HRA', name: 'Executive HRA', category: 'Allowance', seq: 2, method: 'percentage_of_gross', amount: null, pct: 50.00, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000011', structureId: IDS.structures.executive, code: 'EXEC_ALLOW', name: 'Executive Allowance', category: 'Allowance', seq: 3, method: 'fixed_amount', amount: 20000, pct: null, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000012', structureId: IDS.structures.executive, code: 'GROSS', name: 'Gross Salary', category: 'Gross', seq: 4, method: 'formula', amount: null, pct: null, formula: 'BASIC + HRA + EXEC_ALLOW' },
      { id: 'e0000000-0000-0000-0000-000000000013', structureId: IDS.structures.executive, code: 'PF', name: 'Provident Fund', category: 'Deduction', seq: 5, method: 'percentage_of_gross', amount: null, pct: 12.00, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000014', structureId: IDS.structures.executive, code: 'TDS', name: 'Tax Deducted at Source', category: 'Deduction', seq: 6, method: 'percentage_of_gross', amount: null, pct: 20.00, formula: null },
      { id: 'e0000000-0000-0000-0000-000000000015', structureId: IDS.structures.executive, code: 'NET', name: 'Net Salary', category: 'Net', seq: 7, method: 'formula', amount: null, pct: null, formula: 'GROSS - PF - TDS' },
    ];

    for (const r of salaryRules) {
      await conn.execute(`
        INSERT INTO salary_rules (id, structure_id, code, name, category, sequence, computation_method, amount, percentage, formula, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category = VALUES(category),
          sequence = VALUES(sequence),
          computation_method = VALUES(computation_method),
          amount = VALUES(amount),
          percentage = VALUES(percentage),
          formula = VALUES(formula),
          is_active = 1
      `, [r.id, r.structureId, r.code, r.name, r.category, r.seq, r.method, r.amount, r.pct, r.formula]);
    }
    console.log('  ✓ Salary rules seeded');

    // 4. Time off types
    const timeOffTypes = [
      { id: IDS.timeOffTypes.pto,    name: 'Paid Time Off', unit: 'days', allocReq: 1, mode: 'time_off', isPaid: 1, color: '#10B981', notes: 'Standard annual paid leave' },
      { id: IDS.timeOffTypes.sick,   name: 'Sick Leave',    unit: 'days', allocReq: 1, mode: 'time_off', isPaid: 1, color: '#F59E0B', notes: 'Medical and health leave' },
      { id: IDS.timeOffTypes.casual, name: 'Casual Leave',  unit: 'days', allocReq: 1, mode: 'time_off', isPaid: 1, color: '#3B82F6', notes: 'Urgent personal work' },
      { id: IDS.timeOffTypes.unpaid, name: 'Unpaid Leave',  unit: 'days', allocReq: 0, mode: 'no_validation', isPaid: 0, color: '#EF4444', notes: 'Unpaid time off' },
    ];

    for (const t of timeOffTypes) {
      await conn.execute(`
        INSERT INTO time_off_types (id, name, unit, allocation_required, approval_mode, is_paid, color, is_active, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        ON DUPLICATE KEY UPDATE
          unit = VALUES(unit),
          allocation_required = VALUES(allocation_required),
          approval_mode = VALUES(approval_mode),
          is_paid = VALUES(is_paid),
          color = VALUES(color),
          notes = VALUES(notes),
          is_active = 1
      `, [t.id, t.name, t.unit, t.allocReq, t.mode, t.isPaid, t.color, t.notes]);
    }
    console.log('  ✓ Time-off types seeded');

    // 5. Employees
    const employees = [
      {
        id: IDS.emp.admin,
        number: 'EMP-00001',
        firstName: 'Anuj',
        lastName: 'Patel',
        email: 'anuj.patel@company.com',
        phone: '+1-555-0101',
        jobTitle: 'System Administrator',
        type: 'full_time',
        companyId: IDS.companies.primary,
        departmentId: IDS.departments.hr,
        managerId: null,
        hireDate: '2023-01-01',
        location: 'New York, USA',
      },
      {
        id: IDS.emp.hrManager,
        number: 'EMP-00002',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@company.com',
        phone: '+1-555-0102',
        jobTitle: 'HR Director',
        type: 'full_time',
        companyId: IDS.companies.primary,
        departmentId: IDS.departments.hr,
        managerId: IDS.emp.admin,
        hireDate: '2023-01-15',
        location: 'New York, USA',
      },
      {
        id: IDS.emp.hrPayrollMgr,
        number: 'EMP-00003',
        firstName: 'Neha',
        lastName: 'Desai',
        email: 'neha.desai@company.com',
        phone: '+1-555-0103',
        jobTitle: 'Payroll Lead',
        type: 'full_time',
        companyId: IDS.companies.primary,
        departmentId: IDS.departments.finance,
        managerId: IDS.emp.hrManager,
        hireDate: '2023-02-01',
        location: 'Chicago, USA',
      },
      {
        id: IDS.emp.hrPayrollUser,
        number: 'EMP-00004',
        firstName: 'Rahul',
        lastName: 'Verma',
        email: 'rahul.verma@company.com',
        phone: '+1-555-0104',
        jobTitle: 'Payroll Specialist',
        type: 'full_time',
        companyId: IDS.companies.primary,
        departmentId: IDS.departments.finance,
        managerId: IDS.emp.hrPayrollMgr,
        hireDate: '2023-03-01',
        location: 'Chicago, USA',
      },
      {
        id: IDS.emp.devLead,
        number: 'EMP-00005',
        firstName: 'Vikram',
        lastName: 'Singh',
        email: 'vikram.singh@company.com',
        phone: '+1-555-0105',
        jobTitle: 'Senior Software Engineer',
        type: 'full_time',
        companyId: IDS.companies.primary,
        departmentId: IDS.departments.engineering,
        managerId: IDS.emp.admin,
        hireDate: '2023-04-01',
        location: 'San Francisco, USA',
      },
      {
        id: IDS.emp.devFrontend,
        number: 'EMP-00006',
        firstName: 'Sneha',
        lastName: 'Patel',
        email: 'sneha.patel@company.com',
        phone: '+1-555-0106',
        jobTitle: 'Frontend Developer',
        type: 'full_time',
        companyId: IDS.companies.primary,
        departmentId: IDS.departments.engineering,
        managerId: IDS.emp.devLead,
        hireDate: '2023-05-15',
        location: 'San Francisco, USA',
      },
      {
        id: IDS.emp.qaEngineer,
        number: 'EMP-00007',
        firstName: 'Amit',
        lastName: 'Kumar',
        email: 'amit.kumar@company.com',
        phone: '+1-555-0107',
        jobTitle: 'QA Engineer',
        type: 'full_time',
        companyId: IDS.companies.primary,
        departmentId: IDS.departments.engineering,
        managerId: IDS.emp.devLead,
        hireDate: '2023-06-01',
        location: 'Austin, USA',
      },
      {
        id: IDS.emp.designer,
        number: 'EMP-00008',
        firstName: 'Kavita',
        lastName: 'Reddy',
        email: 'kavita.reddy@company.com',
        phone: '+1-555-0108',
        jobTitle: 'UI/UX Designer',
        type: 'full_time',
        companyId: IDS.companies.primary,
        departmentId: IDS.departments.design,
        managerId: IDS.emp.hrManager,
        hireDate: '2023-07-01',
        location: 'Austin, USA',
      },
    ];

    for (const e of employees) {
      await conn.execute(`
        INSERT INTO employees
          (id, employee_number, first_name, last_name, work_email, phone, job_title,
           employment_type, company_id, department_id, schedule_id, hire_date, location, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE
          employee_number = VALUES(employee_number),
          first_name = VALUES(first_name),
          last_name = VALUES(last_name),
          phone = VALUES(phone),
          job_title = VALUES(job_title),
          employment_type = VALUES(employment_type),
          company_id = VALUES(company_id),
          department_id = VALUES(department_id),
          schedule_id = VALUES(schedule_id),
          hire_date = VALUES(hire_date),
          location = VALUES(location),
          status = 'active'
      `, [e.id, e.number, e.firstName, e.lastName, e.email, e.phone, e.jobTitle, e.type, e.companyId, e.departmentId, IDS.schedules.standard40h, e.hireDate, e.location]);
    }

    // Update managers now that all employees exist
    for (const e of employees) {
      if (e.managerId) {
        await conn.execute(`UPDATE employees SET manager_id = ? WHERE id = ?`, [e.managerId, e.id]);
      }
    }
    console.log('  ✓ Employees seeded');

    // 6. Users
    const password = await hashPassword('Test@1234');

    const users = [
      { id: IDS.user.admin,        empId: IDS.emp.admin,        name: 'Anuj Patel',   email: 'anuj.patel@company.com',   role: 'Admin' },
      { id: IDS.user.hrManager,    empId: IDS.emp.hrManager,    name: 'Priya Sharma', email: 'priya.sharma@company.com',  role: 'HR Manager' },
      { id: IDS.user.hrPayrollMgr, empId: IDS.emp.hrPayrollMgr, name: 'Neha Desai',   email: 'neha.desai@company.com',    role: 'HR Payroll Manager' },
      { id: IDS.user.hrPayrollUser,empId: IDS.emp.hrPayrollUser,name: 'Rahul Verma',  email: 'rahul.verma@company.com',   role: 'HR Payroll User' },
      { id: IDS.user.devLead,      empId: IDS.emp.devLead,      name: 'Vikram Singh', email: 'vikram.singh@company.com',  role: 'Employee' },
      { id: IDS.user.devFrontend,  empId: IDS.emp.devFrontend,  name: 'Sneha Patel',  email: 'sneha.patel@company.com',   role: 'Employee' },
      { id: IDS.user.qaEngineer,   empId: IDS.emp.qaEngineer,   name: 'Amit Kumar',   email: 'amit.kumar@company.com',    role: 'Employee' },
      { id: IDS.user.designer,     empId: IDS.emp.designer,     name: 'Kavita Reddy', email: 'kavita.reddy@company.com',  role: 'Employee' },
    ];

    for (const u of users) {
      await conn.execute(`
        INSERT INTO users (id, employee_id, name, work_email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          employee_id = VALUES(employee_id),
          name = VALUES(name),
          work_email = VALUES(work_email),
          password_hash = VALUES(password_hash),
          role = VALUES(role),
          is_active = 1
      `, [u.id, u.empId, u.name, u.email, password, u.role]);
    }
    console.log('  ✓ Users seeded');

    // 7. Contracts
    const contracts = [
      { id: IDS.contracts.admin,        empId: IDS.emp.admin,        ref: 'CNT-2023-001', dept: 'IT Operations',    pos: 'System Administrator',     wage: 110000.00, start: '2023-01-01', structureId: IDS.structures.executive },
      { id: IDS.contracts.hrManager,    empId: IDS.emp.hrManager,    ref: 'CNT-2023-002', dept: 'Human Resources',  pos: 'HR Director',              wage: 105000.00, start: '2023-01-15', structureId: IDS.structures.executive },
      { id: IDS.contracts.hrPayrollMgr, empId: IDS.emp.hrPayrollMgr, ref: 'CNT-2023-003', dept: 'Finance & Payroll',pos: 'Payroll Lead',             wage: 95000.00,  start: '2023-02-01', structureId: IDS.structures.standard },
      { id: IDS.contracts.hrPayrollUser,empId: IDS.emp.hrPayrollUser,ref: 'CNT-2023-004', dept: 'Finance & Payroll',pos: 'Payroll Specialist',       wage: 65000.00,  start: '2023-03-01', structureId: IDS.structures.standard },
      { id: IDS.contracts.devLead,      empId: IDS.emp.devLead,      ref: 'CNT-2023-005', dept: 'Engineering',      pos: 'Senior Software Engineer', wage: 90000.00,  start: '2023-04-01', structureId: IDS.structures.standard },
      { id: IDS.contracts.devFrontend,  empId: IDS.emp.devFrontend,  ref: 'CNT-2023-006', dept: 'Engineering',      pos: 'Frontend Developer',       wage: 75000.00,  start: '2023-05-15', structureId: IDS.structures.standard },
      { id: IDS.contracts.qaEngineer,   empId: IDS.emp.qaEngineer,   ref: 'CNT-2023-007', dept: 'Engineering',      pos: 'QA Engineer',              wage: 70000.00,  start: '2023-06-01', structureId: IDS.structures.standard },
      { id: IDS.contracts.designer,     empId: IDS.emp.designer,     ref: 'CNT-2023-008', dept: 'Product Design',   pos: 'UI/UX Designer',           wage: 72000.00,  start: '2023-07-01', structureId: IDS.structures.standard },
    ];

    for (const c of contracts) {
      await conn.execute(`
        INSERT INTO contracts (id, employee_id, company_id, contract_ref, status, department, job_position, wage, start_date, schedule_id, structure_id)
        VALUES (?, ?, ?, ?, 'Running', ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          contract_ref = VALUES(contract_ref),
          company_id = VALUES(company_id),
          status = 'Running',
          department = VALUES(department),
          job_position = VALUES(job_position),
          wage = VALUES(wage),
          start_date = VALUES(start_date),
          schedule_id = VALUES(schedule_id),
          structure_id = VALUES(structure_id)
      `, [c.id, c.empId, IDS.companies.primary, c.ref, c.dept, c.pos, c.wage, c.start, IDS.schedules.standard40h, c.structureId]);

      // Link current contract to employee
      await conn.execute(`UPDATE employees SET current_contract_id = ? WHERE id = ?`, [c.id, c.empId]);
    }
    console.log('  ✓ Contracts seeded');

    // 8. Time off allocations (Year 2026)
    const currentYear = 2026;
    let allocIdx = 1;
    for (const emp of employees) {
      const allocations = [
        { typeId: IDS.timeOffTypes.pto,    total: 20, used: 2 },
        { typeId: IDS.timeOffTypes.sick,   total: 10, used: 1 },
        { typeId: IDS.timeOffTypes.casual, total: 7,  used: 0 },
      ];

      for (const a of allocations) {
        const allocId = `i0000000-0000-0000-0000-${String(allocIdx++).padStart(12, '0')}`;
        await conn.execute(`
          INSERT INTO time_off_allocations
            (id, employee_id, type_id, year, total_days, used_days, validity_start, validity_end, approver_id, status)
          VALUES (?, ?, ?, ?, ?, ?, '2026-01-01', '2026-12-31', ?, 'Approved')
          ON DUPLICATE KEY UPDATE
            total_days = VALUES(total_days),
            used_days = VALUES(used_days),
            validity_start = VALUES(validity_start),
            validity_end = VALUES(validity_end),
            approver_id = VALUES(approver_id),
            status = 'Approved'
        `, [allocId, emp.id, a.typeId, currentYear, a.total, a.used, IDS.user.hrManager]);
      }
    }
    console.log('  ✓ Time-off allocations seeded');

    // 9. Time off requests
    const sampleRequests = [
      {
        id: 'j0000000-0000-0000-0000-000000000001',
        empId: IDS.emp.devLead,
        typeId: IDS.timeOffTypes.pto,
        startDate: '2026-02-10',
        endDate: '2026-02-11',
        days: 2,
        status: 'Approved',
        reason: 'Family event',
      },
      {
        id: 'j0000000-0000-0000-0000-000000000002',
        empId: IDS.emp.devFrontend,
        typeId: IDS.timeOffTypes.sick,
        startDate: '2026-02-18',
        endDate: '2026-02-18',
        days: 1,
        status: 'Approved',
        reason: 'Medical checkup',
      },
      {
        id: 'j0000000-0000-0000-0000-000000000003',
        empId: IDS.emp.qaEngineer,
        typeId: IDS.timeOffTypes.pto,
        startDate: '2026-03-15',
        endDate: '2026-03-17',
        days: 3,
        status: 'Confirmed',
        reason: 'Vacation plan',
      },
    ];

    for (const r of sampleRequests) {
      await conn.execute(`
        INSERT INTO time_off_requests (id, employee_id, type_id, start_date, end_date, days, status, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          start_date = VALUES(start_date),
          end_date = VALUES(end_date),
          days = VALUES(days),
          status = VALUES(status),
          reason = VALUES(reason)
      `, [r.id, r.empId, r.typeId, r.startDate, r.endDate, r.days, r.status, r.reason]);
    }
    console.log('  ✓ Time-off requests seeded');

    // 10. Attendance records (Recent dates)
    const attendanceDates = ['2026-02-23', '2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27'];
    let attIdx = 1;

    for (const d of attendanceDates) {
      for (const emp of employees) {
        const attId = `k0000000-0000-0000-0000-${String(attIdx++).padStart(12, '0')}`;
        await conn.execute(`
          INSERT INTO attendance_records
            (id, employee_id, date, check_in, check_out, worked_minutes, overtime_minutes, status, is_manual_entry)
          VALUES (?, ?, ?, ?, ?, 480, 0, 'Present', 0)
          ON DUPLICATE KEY UPDATE
            check_in = VALUES(check_in),
            check_out = VALUES(check_out),
            worked_minutes = VALUES(worked_minutes),
            status = VALUES(status)
        `, [attId, emp.id, d, `${d} 09:00:00`, `${d} 18:00:00`]);
      }
    }
    console.log('  ✓ Attendance records seeded');

    // 11. Payruns
    const payruns = [
      {
        id: IDS.payruns.jan2026,
        name: 'Payrun - January 2026',
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
        structureId: IDS.structures.standard,
        status: 'Paid',
        totalGross: 520000.00,
        totalNet: 405600.00,
        warningCount: 0,
        paidAt: '2026-01-31 18:00:00',
        paidBy: IDS.user.hrPayrollMgr,
      },
      {
        id: IDS.payruns.feb2026,
        name: 'Payrun - February 2026',
        periodStart: '2026-02-01',
        periodEnd: '2026-02-28',
        structureId: IDS.structures.standard,
        status: 'Validated',
        totalGross: 520000.00,
        totalNet: 405600.00,
        warningCount: 0,
        paidAt: null,
        paidBy: null,
      },
    ];

    for (const pr of payruns) {
      await conn.execute(`
        INSERT INTO payruns
          (id, company_id, name, period_start, period_end, structure_id, status, total_gross, total_net, warning_count, paid_at, paid_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          company_id = VALUES(company_id),
          name = VALUES(name),
          period_start = VALUES(period_start),
          period_end = VALUES(period_end),
          structure_id = VALUES(structure_id),
          status = VALUES(status),
          total_gross = VALUES(total_gross),
          total_net = VALUES(total_net),
          warning_count = VALUES(warning_count),
          paid_at = VALUES(paid_at),
          paid_by = VALUES(paid_by)
      `, [pr.id, IDS.companies.primary, pr.name, pr.periodStart, pr.periodEnd, pr.structureId, pr.status, pr.totalGross, pr.totalNet, pr.warningCount, pr.paidAt, pr.paidBy]);
    }
    console.log('  ✓ Payruns seeded');

    // 12. Payslips & Payslip Lines (for Jan 2026 and Feb 2026)
    let psIdx = 1;
    let lineIdx = 1;

    for (const pr of payruns) {
      for (const emp of employees) {
        const contract = contracts.find((c) => c.empId === emp.id)!;
        const payslipId = `l0000000-0000-0000-0000-${String(psIdx++).padStart(12, '0')}`;
        const gross = 65000.00;
        const deductions = 14300.00;
        const net = 50700.00;

        await conn.execute(`
          INSERT INTO payslips
            (id, payrun_id, employee_id, contract_id, gross, deductions, net, worked_days, status, warning_codes)
          VALUES (?, ?, ?, ?, ?, ?, ?, 22.00, ?, '[]')
          ON DUPLICATE KEY UPDATE
            contract_id = VALUES(contract_id),
            gross = VALUES(gross),
            deductions = VALUES(deductions),
            net = VALUES(net),
            worked_days = VALUES(worked_days),
            status = VALUES(status),
            warning_codes = VALUES(warning_codes)
        `, [payslipId, pr.id, emp.id, contract.id, gross, deductions, net, pr.status]);

        // Lines
        const lines = [
          { code: 'BASIC',      name: 'Basic Salary',             cat: 'Basic',     amount: 50000.00, seq: 1 },
          { code: 'HRA',        name: 'House Rent Allowance',     cat: 'Allowance', amount: 7000.00,  seq: 2 },
          { code: 'CONVEYANCE', name: 'Conveyance Allowance',     cat: 'Allowance', amount: 3000.00,  seq: 3 },
          { code: 'SPECIAL',    name: 'Special Allowance',        cat: 'Allowance', amount: 5000.00,  seq: 4 },
          { code: 'GROSS',      name: 'Gross Salary',             cat: 'Gross',     amount: 65000.00, seq: 5 },
          { code: 'PF',         name: 'Provident Fund',           cat: 'Deduction', amount: 7800.00,  seq: 6 },
          { code: 'TDS',        name: 'Tax Deducted at Source',   cat: 'Deduction', amount: 6500.00,  seq: 7 },
          { code: 'NET',        name: 'Net Salary',               cat: 'Net',       amount: 50700.00, seq: 8 },
        ];

        for (const ln of lines) {
          const lineId = `m0000000-0000-0000-0000-${String(lineIdx++).padStart(12, '0')}`;
          await conn.execute(`
            INSERT INTO payslip_lines (id, payslip_id, rule_code, rule_name, category, amount, sequence)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              rule_name = VALUES(rule_name),
              category = VALUES(category),
              amount = VALUES(amount),
              sequence = VALUES(sequence)
          `, [lineId, payslipId, ln.code, ln.name, ln.cat, ln.amount, ln.seq]);
        }
      }
    }
    console.log('  ✓ Payslips & Payslip Lines seeded');

    await conn.commit();

    console.log('\n========================================================');
    console.log('  ✓ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================================');
    console.log('  Password for all accounts: Test@1234');
    console.log('========================================================');
    console.log('  Role                 Name             Email');
    console.log('  ──────────────────── ──────────────── ─────────────────────────');
    for (const u of users) {
      console.log(`  ${u.role.padEnd(20)} ${u.name.padEnd(16)} ${u.email}`);
    }
    console.log('========================================================\n');

  } catch (err) {
    await conn.rollback();
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
