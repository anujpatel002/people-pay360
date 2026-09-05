import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import {
  listEmployees, getEmployee, createEmployee,
  updateEmployee, archiveEmployee, restoreEmployee, getSmartCounts,
} from '../controllers/employees.controller';

const HR = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;
const h  = (fn: Function) => fn as unknown as RequestHandler;

const router = Router();
router.use(authMiddleware as unknown as RequestHandler);

router.get('/',                 h(listEmployees));
router.get('/:id',              h(getEmployee));
router.get('/:id/smart-counts', h(getSmartCounts));
router.post('/',                requireRoles(...HR) as unknown as RequestHandler, h(createEmployee));
router.put('/:id',              requireRoles(...HR) as unknown as RequestHandler, h(updateEmployee));
router.delete('/:id',           requireRoles(...HR) as unknown as RequestHandler, h(archiveEmployee));
router.post('/:id/restore',     requireRoles(...HR) as unknown as RequestHandler, h(restoreEmployee));

export default router;
