import pool from '../../database/connection/pool';
import { hashPassword } from '../../modules/auth/services/password.service';

interface SeedUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
}

const SEED_USERS: SeedUser[] = [
  { firstName: 'Anuj',        lastName: 'Patel',  email: 'anuj.patel@company.com',        role: 'Admin',            password: 'Admin@1234' },
  { firstName: 'Ahmedabbas',  lastName: 'Momin',  email: 'ahmedabbas.momin@company.com',  role: 'HR Payroll Manager', password: 'Admin@1234' },
  { firstName: 'Tirth',       lastName: 'Mantri', email: 'tirth.mantri@company.com',      role: 'HR Manager',       password: 'Admin@1234' },
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const u of SEED_USERS) {
      // Upsert employee
      const empId = require('crypto').randomUUID() as string;
      await conn.execute(
        `INSERT INTO employees (id, first_name, last_name, work_email, hire_date, status)
         VALUES (?, ?, ?, ?, CURDATE(), 'active')
         ON DUPLICATE KEY UPDATE first_name = VALUES(first_name)`,
        [empId, u.firstName, u.lastName, u.email]
      );

      const [empRows] = await conn.execute<any[]>(
        'SELECT id FROM employees WHERE work_email = ?',
        [u.email]
      );
      const actualEmpId = empRows[0].id;

      const passwordHash = await hashPassword(u.password);
      await conn.execute(
        `INSERT INTO users (id, employee_id, name, work_email, password_hash, role, is_active)
         VALUES (UUID(), ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [actualEmpId, `${u.firstName} ${u.lastName}`, u.email, passwordHash, u.role]
      );

      console.log(`Seeded: ${u.email} / ${u.password} (${u.role})`);
    }

    await conn.commit();
    console.log('\nSeed complete.');
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
