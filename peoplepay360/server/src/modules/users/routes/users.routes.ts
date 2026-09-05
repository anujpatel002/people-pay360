import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import {
  listUsersHandler, getUserHandler, createUserHandler,
  updateUserHandler, deactivateUserHandler,
} from '../controllers/users.controller';

const h = (fn: Function) => fn as unknown as RequestHandler;

const router = Router();
router.use(authMiddleware as unknown as RequestHandler);
router.use(requireRoles('Admin') as unknown as RequestHandler);

router.get('/',       h(listUsersHandler));
router.get('/:id',    h(getUserHandler));
router.post('/',      h(createUserHandler));
router.put('/:id',    h(updateUserHandler));
router.delete('/:id', h(deactivateUserHandler));

export default router;
