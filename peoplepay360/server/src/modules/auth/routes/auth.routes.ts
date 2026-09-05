import { Router } from 'express';
import { loginHandler, logoutHandler, refreshHandler } from '../controllers/auth.controller';

const router = Router();

router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.post('/refresh', refreshHandler);

export default router;
