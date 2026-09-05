import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { env } from '../../../config/env';
import { AuthUser } from '../../../shared/types';
import { UnauthorizedError } from '../../../shared/errors/AppError';

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, employeeId: user.employeeId, name: user.name, email: user.email, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): AuthUser {
  try {
    return jwt.verify(token, env.jwt.accessSecret) as AuthUser;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.execute(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (UUID(), ?, ?, ?)',
    [userId, hash, expiresAt]
  );

  return raw;
}

interface RefreshTokenRow extends RowDataPacket {
  id: string;
  user_id: string;
  expires_at: Date;
  revoked: number;
}

export async function rotateRefreshToken(raw: string): Promise<{ userId: string; newRaw: string }> {
  const hash = crypto.createHash('sha256').update(raw).digest('hex');

  const [rows] = await pool.execute<RefreshTokenRow[]>(
    'SELECT id, user_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = ?',
    [hash]
  );

  const token = rows[0];
  if (!token || token.revoked || new Date(token.expires_at) < new Date()) {
    throw new UnauthorizedError('Refresh token expired or invalid');
  }

  await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [token.id]);

  const newRaw = await issueRefreshToken(token.user_id);
  return { userId: token.user_id, newRaw };
}

export async function revokeRefreshToken(raw: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [hash]);
}
