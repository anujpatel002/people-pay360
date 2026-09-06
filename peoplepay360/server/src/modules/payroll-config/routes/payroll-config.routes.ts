import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import {
  listStructures, getStructure, createStructure, updateStructure, deleteStructure,
  listRules, createRule, updateRule, deleteRule,
} from '../controllers/payroll-config.controller';

const READ  = ['HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;
const WRITE = ['HR Payroll Manager', 'Admin'] as const;
const h     = (fn: Function) => fn as unknown as RequestHandler;

const router = Router();
router.use(authMiddleware as unknown as RequestHandler);

// Structures
router.get('/structures',      requireRoles(...READ)  as unknown as RequestHandler, h(listStructures));
router.get('/structures/:id',  requireRoles(...READ)  as unknown as RequestHandler, h(getStructure));
router.post('/structures',     requireRoles(...WRITE) as unknown as RequestHandler, h(createStructure));
router.put('/structures/:id',  requireRoles(...WRITE) as unknown as RequestHandler, h(updateStructure));
router.delete('/structures/:id', requireRoles(...WRITE) as unknown as RequestHandler, h(deleteStructure));

// Rules
router.get('/rules',      requireRoles(...READ)  as unknown as RequestHandler, h(listRules));
router.post('/rules',     requireRoles(...WRITE) as unknown as RequestHandler, h(createRule));
router.put('/rules/:id',  requireRoles(...WRITE) as unknown as RequestHandler, h(updateRule));
router.delete('/rules/:id', requireRoles(...WRITE) as unknown as RequestHandler, h(deleteRule));

export default router;
