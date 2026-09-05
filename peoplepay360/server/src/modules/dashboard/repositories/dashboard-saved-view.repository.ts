/**
 * dashboard-saved-view.repository.ts
 * Repository for user-specific dashboard saved filter views.
 */
import { RowDataPacket } from 'mysql2';
import pool from '../../../database/connection/pool';
import { DashboardSavedView } from '../types/dashboard.types';

interface SavedViewRow extends RowDataPacket {
  id: string;
  user_id: string;
  name: string;
  period: string | null;
  company_id: string | null;
  department_id: string | null;
  employment_type: string | null;
  is_default: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function mapRowToSavedView(r: SavedViewRow): DashboardSavedView {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    period: r.period,
    companyId: r.company_id,
    departmentId: r.department_id,
    employmentType: r.employment_type,
    isDefault: Boolean(r.is_default),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
    deletedAt: r.deleted_at ? new Date(r.deleted_at).toISOString() : null,
  };
}

export interface CreateSavedViewDto {
  userId: string;
  name: string;
  period?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  employmentType?: string | null;
  isDefault?: boolean;
}

export interface UpdateSavedViewDto {
  name?: string;
  period?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  employmentType?: string | null;
  isDefault?: boolean;
}

export async function findByUserId(userId: string): Promise<DashboardSavedView[]> {
  const [rows] = await pool.execute<SavedViewRow[]>(`
    SELECT * FROM dashboard_saved_views
    WHERE user_id = ? AND deleted_at IS NULL
    ORDER BY is_default DESC, name ASC
  `, [userId]);
  return rows.map(mapRowToSavedView);
}

export async function findByIdAndUserId(id: string, userId: string): Promise<DashboardSavedView | null> {
  const [rows] = await pool.execute<SavedViewRow[]>(`
    SELECT * FROM dashboard_saved_views
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    LIMIT 1
  `, [id, userId]);
  if (!rows.length) return null;
  return mapRowToSavedView(rows[0]);
}

export async function findByNameAndUserId(name: string, userId: string, excludeId?: string): Promise<DashboardSavedView | null> {
  let query = 'SELECT * FROM dashboard_saved_views WHERE user_id = ? AND name = ? AND deleted_at IS NULL';
  const params: unknown[] = [userId, name];

  if (excludeId) {
    query += ' AND id <> ?';
    params.push(excludeId);
  }

  query += ' LIMIT 1';
  const [rows] = await pool.execute<SavedViewRow[]>(query, params as any[]);
  if (!rows.length) return null;
  return mapRowToSavedView(rows[0]);
}

export async function clearDefaultFlag(userId: string): Promise<void> {
  await pool.execute(
    'UPDATE dashboard_saved_views SET is_default = 0 WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );
}

export async function create(dto: CreateSavedViewDto): Promise<DashboardSavedView> {
  if (dto.isDefault) {
    await clearDefaultFlag(dto.userId);
  }

  const id = crypto.randomUUID();
  await pool.execute(`
    INSERT INTO dashboard_saved_views (
      id, user_id, name, period, company_id, department_id, employment_type, is_default
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    dto.userId,
    dto.name,
    dto.period ?? null,
    dto.companyId ?? null,
    dto.departmentId ?? null,
    dto.employmentType ?? null,
    dto.isDefault ? 1 : 0,
  ]);

  const created = await findByIdAndUserId(id, dto.userId);
  return created!;
}

export async function update(
  id: string,
  userId: string,
  dto: UpdateSavedViewDto
): Promise<DashboardSavedView | null> {
  if (dto.isDefault) {
    await clearDefaultFlag(userId);
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (dto.name !== undefined) {
    updates.push('name = ?');
    params.push(dto.name);
  }
  if (dto.period !== undefined) {
    updates.push('period = ?');
    params.push(dto.period);
  }
  if (dto.companyId !== undefined) {
    updates.push('company_id = ?');
    params.push(dto.companyId);
  }
  if (dto.departmentId !== undefined) {
    updates.push('department_id = ?');
    params.push(dto.departmentId);
  }
  if (dto.employmentType !== undefined) {
    updates.push('employment_type = ?');
    params.push(dto.employmentType);
  }
  if (dto.isDefault !== undefined) {
    updates.push('is_default = ?');
    params.push(dto.isDefault ? 1 : 0);
  }

  if (updates.length === 0) {
    return findByIdAndUserId(id, userId);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id, userId);

  await pool.execute(`
    UPDATE dashboard_saved_views
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `, params as any[]);

  return findByIdAndUserId(id, userId);
}

export async function softDelete(id: string, userId: string): Promise<boolean> {
  const [result] = await pool.execute<any>(`
    UPDATE dashboard_saved_views
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `, [id, userId]);

  return result.affectedRows > 0;
}
