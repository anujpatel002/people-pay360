import pool from '../../../database/connection/pool';
import { ValidationError } from '../../../shared/errors/AppError';

export async function deductBalance(allocationId: string, days: number): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute<any[]>(
      'SELECT total_days, used_days FROM time_off_allocations WHERE id = ? FOR UPDATE',
      [allocationId]
    );
    const row = rows[0];
    if (!row) throw new ValidationError('Allocation not found');

    const remaining = Number(row.total_days) - Number(row.used_days);
    if (days > remaining) {
      throw new ValidationError(
        `Insufficient allocation balance to approve this request. Available: ${remaining}, Requested: ${days}`
      );
    }

    await conn.execute(
      'UPDATE time_off_allocations SET used_days = used_days + ? WHERE id = ?',
      [days, allocationId]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function restoreBalance(allocationId: string, days: number): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'UPDATE time_off_allocations SET used_days = GREATEST(0, used_days - ?) WHERE id = ?',
      [days, allocationId]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
