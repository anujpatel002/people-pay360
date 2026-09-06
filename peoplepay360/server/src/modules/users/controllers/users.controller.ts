import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { createUserSchema, updateUserSchema } from '../validators/users.validator';
import * as usersService from '../services/users.service';

export async function listUsersHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { search, role, status, sortBy, sortOrder, page, limit } = req.query as Record<string, string>;
    const result = await usersService.getUsers({
      search,
      role,
      status,
      sortBy,
      sortOrder: sortOrder as 'ASC' | 'DESC',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUserHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: parsed.error.errors[0].message });
      return;
    }
    const user = await usersService.createUser(parsed.data);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({ error: parsed.error.errors[0].message });
      return;
    }
    const user = await usersService.updateUser(req.params.id, parsed.data, req.user);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function deactivateUserHandler(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    await usersService.deactivateUser(req.params.id, req.user);
    res.json({ message: 'User deactivated', id: req.params.id });
  } catch (err) {
    next(err);
  }
}
