import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { createContractSchema, updateContractSchema } from '../validators/contract.validator';
import * as service from '../services/contracts.service';

export async function listContracts(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      status:     req.query.status     as string | undefined,
      page:       req.query.page  ? Number(req.query.page)  : undefined,
      limit:      req.query.limit ? Number(req.query.limit) : undefined,
    } as Parameters<typeof service.getContracts>[0];

    res.json(await service.getContracts(filters));
  } catch (err) { next(err); }
}

export async function getContract(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    res.json(await service.getContract(req.params.id));
  } catch (err) { next(err); }
}

export async function getActiveContract(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { employeeId, periodStart, periodEnd } = req.query as Record<string, string>;
    if (!employeeId || !periodStart || !periodEnd) {
      res.status(400).json({ error: 'employeeId, periodStart and periodEnd are required' });
      return;
    }
    res.json(await service.getActiveContract(employeeId, periodStart, periodEnd));
  } catch (err) { next(err); }
}

export async function createContract(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createContractSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
    res.status(201).json(await service.createContract(parsed.data));
  } catch (err) { next(err); }
}

export async function updateContract(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = updateContractSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
    res.json(await service.updateContract(req.params.id, parsed.data));
  } catch (err) { next(err); }
}
