import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import {
  attendanceFilterSchema,
  correctAttendanceSchema,
} from '../validators/attendance.validator';
import * as service from '../services/attendance.service';

export async function listAttendance(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = attendanceFilterSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }
    const result = await service.listAttendance(req.user, parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceRecord(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const result = await service.getAttendanceRecord(req.user, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOpenSession(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const result = await service.getOpenSession(req.user);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function checkIn(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const result = await service.checkIn(req.user);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function checkOut(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const result = await service.checkOut(req.user);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function correctRecord(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = correctAttendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: parsed.error.errors[0].message });
      return;
    }
    const result = await service.correctRecord(req.user, req.params.id, parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCorrections(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const result = await service.getCorrections(req.user, req.params.id);
    res.json({
      attendanceId: req.params.id,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
