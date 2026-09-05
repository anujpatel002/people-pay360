import pool from '../../database/connection/pool';
import { hashPassword } from '../../modules/auth/services/password.service';

interface DemoUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    firstName: 'Anuj',
    lastName: 'Patel',
    email: 'anuj.patel@company.com',
    password: 'Admin@1234',
    role: 'Admin',
  },
  {
    firstName: 'Sara',
    lastName: 'Mehta',
    email: 'sara.mehta@company.com',
    password: 'HRManager@1234',
    role: 'HR Manager',
  },
  {
    firstName: 'Raj',
    lastName: 'Sharma',
    email: 'raj.sharma@company.com',
    password: 'PayrollUser@1234',
    role: 'HR Payroll User',
  },
  {
    firstName: 'Priya',
    lastName: 'Verma',
    email: 'priya.verma@company.com',
    password: 'PayrollMgr@1234',
    role: 'HR Payroll Manager',
  },
  {
    firstName: 'Amit',
    lastName: 'Singh',
    email: 'amit.singh@company.com',
    password: 'Employee@1234',
    role: 'Employee',
  },
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const demo of DEMO_USERS) {
      // Upsert employee
      await conn.execute(
        `INSERT INTO employees (id, first_name, last_name, work_email, hire_date, status)
         VALUES (UUID(), ?, ?, ?, CURDATE(), 'active')
         ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name)`,
        [demo.firstName, demo.lastName, demo.email]
      );

      // Fetch the employee id (handles both insert and duplicate)
      const [empRows] = await conn.execute<any[]>(
        'SELECT id FROM employees WHERE work_email = ?',
        [demo.email]
      );
      const employeeId = empRows[0].id;

      const passwordHash = await hashPassword(demo.password);

      // Upsert user
      await conn.execute(
        `INSERT INTO users (id, employee_id, name, work_email, password_hash, role, is_active)
         VALUES (UUID(), ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
        [employeeId, `${demo.firstName} ${demo.lastName}`, demo.email, passwordHash, demo.role]
      );
    }

    await conn.commit();

    console.log('\nDemo seed complete. Credentials:\n');
    console.log('┌─────────────────────────────────┬──────────────────────┬──────────────────────┐');
    console.log('│ Role                            │ Email                │ Password             │');
    console.log('├─────────────────────────────────┼──────────────────────┼──────────────────────┤');
    for (const u of DEMO_USERS) {
      const role = u.role.padEnd(31);
      const email = u.email.padEnd(20);
      const pass = u.password.padEnd(20);
      console.log(`│ ${role} │ ${email} │ ${pass} │`);
    }
    console.log('└─────────────────────────────────┴──────────────────────┴──────────────────────┘');
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
