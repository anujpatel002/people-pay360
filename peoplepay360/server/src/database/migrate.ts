import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const MIGRATIONS_DIR = path.join(__dirname, '../../../database/migrations');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT filename FROM _migrations ORDER BY filename'
    );
    const appliedSet = new Set(rows.map((r) => r.filename as string));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`  skip  ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await conn.beginTransaction();
      await conn.query(sql);
      await conn.execute('INSERT INTO _migrations (filename) VALUES (?)', [file]);
      await conn.commit();
      console.log(`  apply ${file}`);
    }

    console.log('Migrations complete.');
  } catch (err) {
    await conn.rollback();
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
