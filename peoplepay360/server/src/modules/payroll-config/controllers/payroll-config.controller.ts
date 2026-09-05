import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { createStructureSchema, updateStructureSchema, createRuleSchema, updateRuleSchema } from '../validators/payroll-config.validator';
import * as service from '../services/payroll-config.service';

// ─── Structures ──────────────────────────────────────────────────────────────

export async function listStructures(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { search, isActive } = req.query as Record<string, string>;
    res.json(await service.getStructures({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    }));
  } catch (err) { next(err); }
}

export async function getStructure(req: RequestWithUser, res: Response, next: NextFunction) {
  try { res.json(await service.getStructure(req.params.id)); }
  catch (err) { next(err); }
}

export async function createStructure(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createStructureSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.status(201).json(await service.createStructure(parsed.data));
  } catch (err) { next(err); }
}

export async function updateStructure(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = updateStructureSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.json(await service.updateStructure(req.params.id, parsed.data));
  } catch (err) { next(err); }
}

export async function deleteStructure(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    await service.deleteStructure(req.params.id);
    res.json({ message: 'Structure deleted', id: req.params.id });
  } catch (err) { next(err); }
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export async function listRules(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { structureId } = req.query as Record<string, string>;
    res.json(await service.getRules(structureId));
  } catch (err) { next(err); }
}

export async function createRule(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createRuleSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.status(201).json(await service.createRule(parsed.data));
  } catch (err) { next(err); }
}

export async function updateRule(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = updateRuleSchema.safeParse(req.body);
    if (!parsed.success) { res.status(422).json({ error: parsed.error.errors[0].message }); return; }
    res.json(await service.updateRule(req.params.id, parsed.data));
  } catch (err) { next(err); }
}

export async function deleteRule(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    await service.deleteRule(req.params.id);
    res.json({ message: 'Rule deleted', id: req.params.id });
  } catch (err) { next(err); }
}
