import { z } from 'zod';

const EMPLOYMENT_TYPE = ['full_time', 'part_time', 'contractor'] as const;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const createEmployeeSchema = z.object({
  firstName:              z.string().min(1, 'First name is required'),
  lastName:               z.string().min(1, 'Last name is required'),
  workEmail:              z.string().email('Invalid email').transform((v) => v.toLowerCase().trim()),
  phone:                  z.string().optional(),
  privateAddress:         z.string().optional(),
  emergencyContact:       z.string().optional(),
  emergencyContactPhone:  z.string().optional(),
  jobTitle:               z.string().optional(),
  jobPositionId:          z.string().optional(),
  departmentId:           z.string().optional(),
  managerId:              z.string().optional(),
  employmentType:         z.enum(EMPLOYMENT_TYPE, { errorMap: () => ({ message: 'Invalid employment type' }) }),
  companyId:              z.string().optional(),
  location:               z.string().optional(),
  scheduleId:             z.string().optional(),
  hireDate:               z.string().regex(DATE_ONLY, 'Hire date must use YYYY-MM-DD format'),
  bankAccount:            z.string().optional(),
  iban:                   z.string().optional(),
  swift:                  z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
