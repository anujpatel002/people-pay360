import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import {
  listSchedulesHandler,
  getScheduleHandler,
  createScheduleHandler,
  updateScheduleHandler,
  deleteScheduleHandler,
} from '../controllers/working-schedules.controller';

const HR = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;
const h  = (fn: Function) => fn as unknown as RequestHandler;

const router = Router();
router.use(authMiddleware as unknown as RequestHandler);

router.get('/',     h(listSchedulesHandler));
router.get('/:id',  h(getScheduleHandler));
router.post('/',    requireRoles(...HR) as unknown as RequestHandler, h(createScheduleHandler));
router.put('/:id',  requireRoles(...HR) as unknown as RequestHandler, h(updateScheduleHandler));
router.delete('/:id', requireRoles(...HR) as unknown as RequestHandler, h(deleteScheduleHandler));

export default router;
