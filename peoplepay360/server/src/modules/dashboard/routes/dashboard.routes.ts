/**
 * dashboard.routes.ts
 * Express router for Dashboard module.
 * Protected by authMiddleware and requireRoles(HR Manager+).
 */
import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { requireRoles } from '../../../middleware/role-guard.middleware';
import { ROLES } from '../../../shared/constants/roles';
import * as dashboardController from '../controllers/dashboard.controller';
import * as savedViewController from '../controllers/dashboard-saved-view.controller';

const router = Router();
const h = (fn: Function) => fn as unknown as RequestHandler;

// Enforce auth and HR Manager+ RBAC across all dashboard routes
router.use(authMiddleware as unknown as RequestHandler);
router.use(
  requireRoles(
    ROLES.HR_MANAGER,
    ROLES.HR_PAYROLL_USER,
    ROLES.HR_PAYROLL_MANAGER,
    ROLES.ADMIN
  ) as unknown as RequestHandler
);

// Dashboard live aggregation
router.get('/', h(dashboardController.getDashboard));

// Dimension lookups for filter dropdowns (companies, departments, employment types)
router.get('/dimensions', h(dashboardController.getDimensions));

// People Events: work anniversaries
router.get('/people-events', h(dashboardController.getPeopleEvents));

// Alert lifecycle endpoints
router.get('/alerts', h(dashboardController.getAlerts));
router.patch('/alerts/:id', h(dashboardController.patchAlertStatus));

// Saved view endpoints (scoped to authenticated user)
router.get('/saved-views', h(savedViewController.getSavedViews));
router.get('/saved-views/:id', h(savedViewController.getSavedView));
router.post('/saved-views', h(savedViewController.createSavedView));
router.patch('/saved-views/:id', h(savedViewController.updateSavedView));
router.delete('/saved-views/:id', h(savedViewController.deleteSavedView));

export default router;
