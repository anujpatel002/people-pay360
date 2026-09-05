import { Response, NextFunction } from 'express';
import { RequestWithUser, UserRole } from '../shared/types';

export function requireRoles(...roles: UserRole[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
