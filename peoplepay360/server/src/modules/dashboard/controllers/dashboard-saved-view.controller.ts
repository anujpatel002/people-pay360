/**
 * dashboard-saved-view.controller.ts
 * Controller for managing user-specific saved filter views with RBAC and IDOR isolation.
 */
import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import * as savedViewService from '../services/dashboard-saved-view.service';

export async function getSavedViews(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    const views = await savedViewService.getSavedViews(req.user.id);
    res.status(200).json(views);
  } catch (err) {
    next(err);
  }
}

export async function getSavedView(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    const view = await savedViewService.getSavedViewById(req.params.id, req.user.id);
    res.status(200).json(view);
  } catch (err) {
    next(err);
  }
}

export async function createSavedView(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, period, companyId, departmentId, employmentType, isDefault } = req.body;

    const created = await savedViewService.createSavedView(req.user.id, {
      name,
      period,
      companyId,
      departmentId,
      employmentType,
      isDefault,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateSavedView(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, period, companyId, departmentId, employmentType, isDefault } = req.body;

    const updated = await savedViewService.updateSavedView(req.params.id, req.user.id, {
      name,
      period,
      companyId,
      departmentId,
      employmentType,
      isDefault,
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteSavedView(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    await savedViewService.deleteSavedView(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
