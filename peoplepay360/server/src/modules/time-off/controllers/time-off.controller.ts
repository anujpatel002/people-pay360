import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import * as service from '../services/time-off.service';
import {
  createTypeSchema, updateTypeSchema,
  createAllocationSchema, updateAllocationSchema,
  createRequestSchema, refuseRequestSchema,
} from '../validators/time-off.validator';

const HR_ROLES = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];
const isHR = (role: string) => HR_ROLES.includes(role);

// ─── Types ────────────────────────────────────────────────────────────────────

export async function listTypes(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const onlyActive = req.query.isActive !== 'false';
    res.json(await service.listTypes(onlyActive));
  } catch (err) { next(err); }
}

export async function createType(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createTypeSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.status(201).json(await service.createType(parsed.data));
  } catch (err) { next(err); }
}

export async function updateType(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = updateTypeSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.json(await service.updateType(req.params.id, parsed.data));
  } catch (err) { next(err); }
}

// ─── Allocations ──────────────────────────────────────────────────────────────

export async function listAllocations(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { employeeId, typeId, year, page, limit } = req.query as Record<string, string>;
    res.json(await service.listAllocations({
      employeeId, typeId,
      year:  year  ? Number(year)  : undefined,
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
    }));
  } catch (err) { next(err); }
}

export async function createAllocation(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createAllocationSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.status(201).json(await service.createAllocation(parsed.data, req.user.id));
  } catch (err) { next(err); }
}

export async function updateAllocation(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = updateAllocationSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.json(await service.updateAllocation(req.params.id, parsed.data));
  } catch (err) { next(err); }
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function listRequests(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { employeeId, typeId, status, dateFrom, dateTo, page, limit } = req.query as Record<string, string>;
    res.json(await service.listRequests({
      employeeId, typeId, status, dateFrom, dateTo,
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
      requestingEmployeeId: req.user.employeeId,
      isHR: isHR(req.user.role),
    }));
  } catch (err) { next(err); }
}

export async function getRequest(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    res.json(await service.getRequest(req.params.id, req.user.employeeId, isHR(req.user.role)));
  } catch (err) { next(err); }
}

export async function createRequest(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.status(201).json(await service.createRequest(parsed.data, req.user.employeeId));
  } catch (err) { next(err); }
}

export async function approveRequest(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    res.json(await service.approveRequest(req.params.id));
  } catch (err) { next(err); }
}

export async function refuseRequest(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = refuseRequestSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.json(await service.refuseRequest(req.params.id, parsed.data));
  } catch (err) { next(err); }
}

export async function cancelRequest(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    res.json(await service.cancelRequest(req.params.id, req.user.employeeId, isHR(req.user.role)));
  } catch (err) { next(err); }
}

export async function getBalance(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    res.json(await service.getBalance(req.params.employeeId, req.user.employeeId, isHR(req.user.role)));
  } catch (err) { next(err); }
}
