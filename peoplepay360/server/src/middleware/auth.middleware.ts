import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/services/token.service';
import { RequestWithUser } from '../shared/types';

export function authMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
