import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import {
  listContracts, getContract, getActiveContract,
  createContract, updateContract, getContractLookups,
} from '../controllers/contracts.controller';

const HR      = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;
const PAYROLL = ['HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;
const WRITE   = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;

const h = (fn: Function) => fn as unknown as RequestHandler;

const router = Router();
router.use(authMiddleware as unknown as RequestHandler);

router.get('/lookups', requireRoles(...HR)      as unknown as RequestHandler, h(getContractLookups));
router.get('/active',  requireRoles(...PAYROLL) as unknown as RequestHandler, h(getActiveContract));
router.get('/',        requireRoles(...HR)      as unknown as RequestHandler, h(listContracts));
router.get('/:id',     requireRoles(...HR)      as unknown as RequestHandler, h(getContract));
router.post('/',       requireRoles(...WRITE)   as unknown as RequestHandler, h(createContract));
router.put('/:id',     requireRoles(...WRITE)   as unknown as RequestHandler, h(updateContract));

export default router;
