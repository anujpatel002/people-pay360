/**
 * dashboard-saved-view.service.ts
 * Service for managing user-specific saved filter views with ownership and IDOR security.
 */
import * as savedViewRepo from '../repositories/dashboard-saved-view.repository';
import { DashboardSavedView } from '../types/dashboard.types';
import { AppError, NotFoundError, ValidationError } from '../../../shared/errors/AppError';

export interface CreateSavedViewInput {
  name: string;
  period?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  employmentType?: string | null;
  isDefault?: boolean;
}

export interface UpdateSavedViewInput {
  name?: string;
  period?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  employmentType?: string | null;
  isDefault?: boolean;
}

export async function getSavedViews(userId: string): Promise<DashboardSavedView[]> {
  return savedViewRepo.findByUserId(userId);
}

export async function getSavedViewById(id: string, userId: string): Promise<DashboardSavedView> {
  const view = await savedViewRepo.findByIdAndUserId(id, userId);
  if (!view) {
    throw new NotFoundError('Saved view not found or access denied');
  }
  return view;
}

export async function createSavedView(
  userId: string,
  input: CreateSavedViewInput
): Promise<DashboardSavedView> {
  if (!input.name || input.name.trim().length === 0) {
    throw new ValidationError('Saved view name is required');
  }

  const existing = await savedViewRepo.findByNameAndUserId(input.name.trim(), userId);
  if (existing) {
    throw new AppError(409, `A saved view with the name "${input.name.trim()}" already exists`);
  }

  return savedViewRepo.create({
    userId,
    name: input.name.trim(),
    period: input.period,
    companyId: input.companyId,
    departmentId: input.departmentId,
    employmentType: input.employmentType,
    isDefault: input.isDefault,
  });
}

export async function updateSavedView(
  id: string,
  userId: string,
  input: UpdateSavedViewInput
): Promise<DashboardSavedView> {
  // Ensure view exists and belongs to user
  await getSavedViewById(id, userId);

  if (input.name !== undefined) {
    if (input.name.trim().length === 0) {
      throw new ValidationError('Saved view name cannot be empty');
    }
    const existing = await savedViewRepo.findByNameAndUserId(input.name.trim(), userId, id);
    if (existing) {
      throw new AppError(409, `A saved view with the name "${input.name.trim()}" already exists`);
    }
  }

  const updated = await savedViewRepo.update(id, userId, {
    ...input,
    name: input.name !== undefined ? input.name.trim() : undefined,
  });

  if (!updated) {
    throw new NotFoundError('Failed to update saved view');
  }

  return updated;
}

export async function deleteSavedView(id: string, userId: string): Promise<void> {
  // Ensure view exists and belongs to user
  await getSavedViewById(id, userId);

  const deleted = await savedViewRepo.softDelete(id, userId);
  if (!deleted) {
    throw new NotFoundError('Saved view not found or already deleted');
  }
}
