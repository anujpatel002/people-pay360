import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import {
  listAttendance,
  getAttendanceRecord,
  getOpenSession,
  checkIn,
  checkOut,
  correctRecord,
  getCorrections,
  bulkImport,
} from '../controllers/attendance.controller';

const HR = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;

const h = (fn: Function) => fn as unknown as RequestHandler;

const router = Router();

router.use(authMiddleware as unknown as RequestHandler);

// Self-service & general attendance
router.get('/open-session', h(getOpenSession));
router.post('/check-in', h(checkIn));
router.post('/check-out', h(checkOut));
router.get('/', h(listAttendance));
router.get('/:id', h(getAttendanceRecord));

// Authorized correction routes
router.put('/:id/correct', requireRoles(...HR) as unknown as RequestHandler, h(correctRecord));
router.get('/:id/corrections', requireRoles(...HR) as unknown as RequestHandler, h(getCorrections));

// Bulk import (HR only)
router.post('/bulk', requireRoles(...HR) as unknown as RequestHandler, h(bulkImport));

export default router;
