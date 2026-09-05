import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { createScheduleSchema, updateScheduleSchema } from '../validators/working-schedules.validator';
import * as service from '../services/working-schedules.service';

export async function listSchedulesHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { search, isActive } = req.query as Record<string, string>;
    const result = await service.getSchedules({
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function getScheduleHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const schedule = await service.getSchedule(req.params.id);
    res.json(schedule);
  } catch (err) { next(err); }
}

export async function createScheduleHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: parsed.error.errors[0].message });
      return;
    }
    const schedule = await service.createSchedule(parsed.data);
    res.status(201).json(schedule);
  } catch (err) { next(err); }
}

export async function updateScheduleHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = updateScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: parsed.error.errors[0].message });
      return;
    }
    const schedule = await service.updateSchedule(req.params.id, parsed.data);
    res.json(schedule);
  } catch (err) { next(err); }
}

export async function deleteScheduleHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    await service.deleteSchedule(req.params.id);
    res.json({ message: 'Schedule deleted', id: req.params.id });
  } catch (err) { next(err); }
}
