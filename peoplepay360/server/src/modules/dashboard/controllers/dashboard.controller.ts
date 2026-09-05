/**
 * dashboard.controller.ts
 * Read-only controller for dashboard aggregation, dimension lookups, and alerts.
 */
import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import * as dashboardAggregatorService from '../services/dashboard-aggregator.service';
import * as alertService from '../services/dashboard-alert.service';
import * as companyRepo from '../repositories/company.repository';
import * as deptRepo from '../repositories/department.repository';
import * as employmentTypeRepo from '../repositories/employment-type.repository';
import { AlertStatus } from '../types/dashboard.types';

export async function getDashboard(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    const { period, companyId, departmentId, employmentType } = req.query;

    const data = await dashboardAggregatorService.getDashboardData({
      period: typeof period === 'string' ? period : undefined,
      companyId: typeof companyId === 'string' ? companyId : undefined,
      departmentId: typeof departmentId === 'string' ? departmentId : undefined,
      employmentType: typeof employmentType === 'string' ? employmentType : undefined,
    }, req.user.role);

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function getDimensions(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId } = req.query;

    const [companies, departments, employmentTypes] = await Promise.all([
      companyRepo.findAll(true),
      deptRepo.findAll(typeof companyId === 'string' ? companyId : undefined, true),
      employmentTypeRepo.findAll(),
    ]);

    res.status(200).json({
      companies,
      departments,
      employmentTypes,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAlerts(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    const { companyId, status, limit } = req.query;

    const alerts = await alertService.getAlertsList({
      companyId: typeof companyId === 'string' ? companyId : undefined,
      status: typeof status === 'string' ? (status as AlertStatus) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json(alerts);
  } catch (err) {
    next(err);
  }
}

export async function patchAlertStatus(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      res.status(400).json({ error: 'Valid status is required (OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED)' });
      return;
    }

    const updated = await alertService.updateAlertStatus(id, status, req.user?.id);
    if (!updated) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}
