import pool from '../../database/connection/pool';
import { hashPassword } from '../../modules/auth/services/password.service';

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const employeeId = require('crypto').randomUUID();
    await conn.execute(
      `INSERT INTO employees (id, first_name, last_name, work_email, hire_date, status)
       VALUES (?, 'Anuj', 'Patel', 'anuj.patel@company.com', CURDATE(), 'active')
       ON DUPLICATE KEY UPDATE first_name = 'Anuj'`,
      [employeeId]
    );

    // Get actual id in case of duplicate
    const [empRows] = await conn.execute<any[]>(
      'SELECT id FROM employees WHERE work_email = ?',
      ['anuj.patel@company.com']
    );
    const actualEmployeeId = empRows[0].id;

    const passwordHash = await hashPassword('Admin@1234');
    await conn.execute(
      `INSERT INTO users (id, employee_id, name, work_email, password_hash, role, is_active)
       VALUES (UUID(), ?, 'Anuj Patel', 'anuj.patel@company.com', ?, 'Admin', 1)
       ON DUPLICATE KEY UPDATE name = name`,
      [actualEmployeeId, passwordHash]
    );

    await conn.commit();
    console.log('Seed complete. Login: anuj.patel@company.com / Admin@1234');
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
