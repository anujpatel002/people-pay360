import { z } from 'zod';

export const createTypeSchema = z.object({
  name:               z.string().min(1, 'name is required'),
  unit:               z.enum(['days', 'hours']),
  allocationRequired: z.boolean().default(true),
  approvalMode:       z.enum(['no_validation', 'time_off', 'set_by_time_off_officer']).default('time_off'),
  isPaid:             z.boolean().default(true),
  workEntry:          z.string().optional(),
  color:              z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color must be a valid hex code').optional(),
  notes:              z.string().optional(),
});

export const updateTypeSchema = createTypeSchema.partial();

const allocationBase = z.object({
  employeeId:    z.string().min(1, 'employeeId is required'),
  typeId:        z.string().min(1, 'typeId is required'),
  year:          z.number().int().min(2000),
  totalDays:     z.number().positive('totalDays must be positive'),
  validityStart: z.string().min(1, 'validityStart is required'),
  validityEnd:   z.string().min(1, 'validityEnd is required'),
  approverId:    z.string().optional(),
});

export const createAllocationSchema = allocationBase.refine(d => d.validityEnd > d.validityStart, {
  message: 'validityEnd must be after validityStart',
  path: ['validityEnd'],
});

export const updateAllocationSchema = allocationBase
  .omit({ employeeId: true, typeId: true, year: true })
  .partial()
  .refine(d => !d.validityStart || !d.validityEnd || d.validityEnd > d.validityStart, {
    message: 'validityEnd must be after validityStart',
    path: ['validityEnd'],
  });

export const createRequestSchema = z.object({
  typeId:    z.string().min(1, 'typeId is required'),
  startDate: z.string().min(1, 'startDate is required'),
  endDate:   z.string().min(1, 'endDate is required'),
  days:      z.number().positive('days must be positive'),
  reason:    z.string().optional(),
}).refine(d => d.endDate >= d.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
});

export const refuseRequestSchema = z.object({
  refusalReason: z.string().min(1, 'refusalReason is required'),
});

export type CreateTypeInput       = z.infer<typeof createTypeSchema>;
export type UpdateTypeInput       = z.infer<typeof updateTypeSchema>;
export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
export type UpdateAllocationInput = z.infer<typeof updateAllocationSchema>;
export type CreateRequestInput    = z.infer<typeof createRequestSchema>;
export type RefuseRequestInput    = z.infer<typeof refuseRequestSchema>;
