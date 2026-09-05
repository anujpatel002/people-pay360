import { Request, Response, NextFunction, RequestHandler } from 'express';

export type UserRole =
  | 'Employee'
  | 'HR Manager'
  | 'HR Payroll User'
  | 'HR Payroll Manager'
  | 'Admin';

export interface AuthUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user: AuthUser;
}

export type Handler = (req: RequestWithUser, res: Response, next: NextFunction) => void | Promise<void>;
export type RH = RequestHandler;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
