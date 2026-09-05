import pool from '../../database/connection/pool';
import { hashPassword } from '../../modules/auth/services/password.service';

const IDS = {
  schedule: 'a0000000-0000-0000-0000-000000000001',
  emp: {
    admin:       'b0000000-0000-0000-0000-000000000001',
    hrManager:   'b0000000-0000-0000-0000-000000000002',
    hrPayrollMgr:'b0000000-0000-0000-0000-000000000003',
  },
  user: {
    admin:       'c0000000-0000-0000-0000-000000000001',
    hrManager:   'c0000000-0000-0000-0000-000000000002',
    hrPayrollMgr:'c0000000-0000-0000-0000-000000000003',
  },
};

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Working schedule
    await conn.execute(`
      INSERT INTO working_schedules (id, name, company, timezone, weekly_hours, days, is_active)
      VALUES (?, 'Standard 40h', 'Acme Corp', 'UTC', 40.00, '["Mon","Tue","Wed","Thu","Fri"]', 1)
      ON DUPLICATE KEY UPDATE name = name
    `, [IDS.schedule]);

    // 2. Employees
    const employees = [
      { id: IDS.emp.admin,        number: 'EMP-00001', firstName: 'Anuj',  lastName: 'Patel',  email: 'anuj.patel@company.com',  jobTitle: 'System Administrator', type: 'full_time' },
      { id: IDS.emp.hrManager,    number: 'EMP-00002', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@company.com', jobTitle: 'HR Manager',           type: 'full_time' },
      { id: IDS.emp.hrPayrollMgr, number: 'EMP-00003', firstName: 'Neha',  lastName: 'Desai',  email: 'neha.desai@company.com',  jobTitle: 'Payroll Manager',       type: 'full_time' },
    ];

    for (const e of employees) {
      await conn.execute(`
        INSERT INTO employees
          (id, employee_number, first_name, last_name, work_email, job_title,
           employment_type, schedule_id, hire_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2023-01-01', 'active')
        ON DUPLICATE KEY UPDATE first_name = first_name
      `, [e.id, e.number, e.firstName, e.lastName, e.email, e.jobTitle, e.type, IDS.schedule]);
    }

    // 3. Users
    const password = await hashPassword('Test@1234');

    const users = [
      { id: IDS.user.admin,        empId: IDS.emp.admin,        name: 'Anuj Patel',  email: 'anuj.patel@company.com',  role: 'Admin' },
      { id: IDS.user.hrManager,    empId: IDS.emp.hrManager,    name: 'Priya Sharma',email: 'priya.sharma@company.com', role: 'HR Manager' },
      { id: IDS.user.hrPayrollMgr, empId: IDS.emp.hrPayrollMgr, name: 'Neha Desai',  email: 'neha.desai@company.com',  role: 'HR Payroll Manager' },
    ];

    for (const u of users) {
      await conn.execute(`
        INSERT INTO users (id, employee_id, name, work_email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE name = name
      `, [u.id, u.empId, u.name, u.email, password, u.role]);
    }

    await conn.commit();

    console.log('\n✓ Seed complete\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Password for all accounts: Test@1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Role                  Email');
    console.log('  ──────────────────── ─────────────────────────────────');
    for (const u of users) {
      console.log(`  ${u.role.padEnd(20)} ${u.email}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
