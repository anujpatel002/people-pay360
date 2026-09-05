import { z } from 'zod';

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const dayPatternSchema = z.object({
  day: z.enum(DAY_NAMES),
  active: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  end: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  breakMinutes: z.number().int().min(0),
}).refine((d) => {
  if (!d.active) return true;
  return d.start !== null && d.end !== null;
}, { message: 'Active days must have start and end times' });

export const createScheduleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  timezone: z.string().default('UTC'),
  days: z.array(dayPatternSchema).length(7, 'All 7 days must be provided'),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type DayPattern = z.infer<typeof dayPatternSchema>;
