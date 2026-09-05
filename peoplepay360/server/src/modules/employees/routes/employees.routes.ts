import { Router } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import {
  listEmployees, getEmployee, createEmployee,
  updateEmployee, archiveEmployee, restoreEmployee, getSmartCounts,
} from '../controllers/employees.controller';

const HR = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;

const router = Router();
router.use(authMiddleware);

router.get('/',           listEmployees);
router.get('/:id',        getEmployee);
router.get('/:id/smart-counts', getSmartCounts);
router.post('/',          requireRoles(...HR), createEmployee);
router.put('/:id',        requireRoles(...HR), updateEmployee);
router.delete('/:id',     requireRoles(...HR), archiveEmployee);
router.post('/:id/restore', requireRoles(...HR), restoreEmployee);

export default router;
