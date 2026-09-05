import { z } from 'zod';

const ROLE_VALUES = ['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'] as const;

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  workEmail: z.string().email('Valid work email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(ROLE_VALUES, { errorMap: () => ({ message: 'Invalid role' }) }),
  employeeId: z.string().uuid('Valid employeeId is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(ROLE_VALUES, { errorMap: () => ({ message: 'Invalid role' }) }).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
