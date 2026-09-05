import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { comparePassword } from './password.service';
import { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from './token.service';
import { UnauthorizedError, ForbiddenError } from '../../../shared/errors/AppError';
import { AuthUser, UserRole } from '../../../shared/types';

interface UserRow extends RowDataPacket {
  id: string;
  employee_id: string;
  name: string;
  work_email: string;
  password_hash: string;
  role: UserRole;
  is_active: number;
}

export async function login(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; user: AuthUser }> {
  const [rows] = await pool.execute<UserRow[]>(
    'SELECT id, employee_id, name, work_email, password_hash, role, is_active FROM users WHERE work_email = ?',
    [email]
  );

  const userRow = rows[0];
  if (!userRow) throw new UnauthorizedError('Invalid credentials');

  const valid = await comparePassword(password, userRow.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  if (!userRow.is_active) throw new ForbiddenError('Account is inactive');

  const user: AuthUser = {
    id: userRow.id,
    employeeId: userRow.employee_id,
    name: userRow.name,
    email: userRow.work_email,
    role: userRow.role,
  };

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user.id);

  return { accessToken, refreshToken, user };
}

export async function refresh(
  rawToken: string
): Promise<{ accessToken: string; newRefreshToken: string }> {
  const { userId, newRaw } = await rotateRefreshToken(rawToken);

  const [rows] = await pool.execute<UserRow[]>(
    'SELECT id, employee_id, name, work_email, role, is_active FROM users WHERE id = ?',
    [userId]
  );

  const userRow = rows[0];
  if (!userRow || !userRow.is_active) throw new ForbiddenError('Account is inactive');

  const user: AuthUser = {
    id: userRow.id,
    employeeId: userRow.employee_id,
    name: userRow.name,
    email: userRow.work_email,
    role: userRow.role,
  };

  return { accessToken: signAccessToken(user), newRefreshToken: newRaw };
}

export async function logout(rawToken: string): Promise<void> {
  await revokeRefreshToken(rawToken);
}
