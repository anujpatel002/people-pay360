import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '../validators/login.validator';
import * as authService from '../services/auth.service';

const COOKIE_NAME = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { accessToken, refreshToken, user } = await authService.login(
      parsed.data.email,
      parsed.data.password
    );

    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.cookies?.[COOKIE_NAME];
    if (raw) await authService.logout(raw);
    res.clearCookie(COOKIE_NAME);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.cookies?.[COOKIE_NAME];
    if (!raw) {
      res.status(401).json({ error: 'Refresh token expired or invalid' });
      return;
    }

    const { accessToken, newRefreshToken } = await authService.refresh(raw);
    res.cookie(COOKIE_NAME, newRefreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}
