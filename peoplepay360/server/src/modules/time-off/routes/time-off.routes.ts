import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import {
  listTypes, createType, updateType,
  listAllocations, createAllocation, updateAllocation,
  listRequests, getRequest, createRequest,
  approveRequest, refuseRequest, cancelRequest,
  getBalance,
} from '../controllers/time-off.controller';

const HR     = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;
const HM     = ['HR Manager', 'Admin'] as const;

const h = (fn: Function) => fn as unknown as RequestHandler;

const router = Router();
router.use(authMiddleware as unknown as RequestHandler);

// Types — Read: All authenticated; Write: HR Manager+
router.get('/types',      h(listTypes));
router.post('/types',     requireRoles(...HR) as unknown as RequestHandler, h(createType));
router.put('/types/:id',  requireRoles(...HR) as unknown as RequestHandler, h(updateType));

// Allocations — Read: All authenticated; Write: HR Manager+
router.get('/allocations',      h(listAllocations));
router.post('/allocations',     requireRoles(...HM) as unknown as RequestHandler, h(createAllocation));
router.put('/allocations/:id',  requireRoles(...HM) as unknown as RequestHandler, h(updateAllocation));

// Balance — all authenticated (own) or HR (any)
router.get('/balance/:employeeId', h(getBalance));

// Requests — all authenticated can create/view own; HR Manager+ approve/refuse
router.get('/requests',              h(listRequests));
router.get('/requests/:id',          h(getRequest));
router.post('/requests',             h(createRequest));
router.put('/requests/:id/approve',  requireRoles(...HM) as unknown as RequestHandler, h(approveRequest));
router.put('/requests/:id/refuse',   requireRoles(...HM) as unknown as RequestHandler, h(refuseRequest));
router.put('/requests/:id/cancel',   h(cancelRequest));

export default router;
