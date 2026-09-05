import { z } from 'zod';

const CONTRACT_STATUSES = ['New', 'Running', 'Expired', 'Cancelled'] as const;

const contractBase = z.object({
  employeeId:  z.string().min(1, 'employeeId is required'),
  contractRef: z.string().optional(),
  status:      z.enum(CONTRACT_STATUSES).default('New'),
  department:  z.string().optional(),
  jobPosition: z.string().optional(),
  wage:        z.number({ invalid_type_error: 'wage must be a number' }).min(0, 'wage must be non-negative'),
  startDate:   z.string().min(1, 'startDate is required'),
  endDate:     z.string().nullable().optional(),
  scheduleId:  z.string().optional(),
  structureId: z.string().optional(),
  notes:       z.string().optional(),
});

export const createContractSchema = contractBase.refine(
  (d) => !d.endDate || d.endDate > d.startDate,
  { message: 'endDate must be after startDate', path: ['endDate'] }
);

export const updateContractSchema = contractBase
  .omit({ employeeId: true })
  .partial()
  .refine(
    (d) => !d.endDate || !d.startDate || d.endDate > d.startDate,
    { message: 'endDate must be after startDate', path: ['endDate'] }
  );

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
