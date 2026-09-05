import { z } from 'zod';

export const attendanceFilterSchema = z.object({
  employeeId: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom must be in YYYY-MM-DD format').optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo must be in YYYY-MM-DD format').optional(),
  status: z.enum(['Present', 'Late', 'Absent', 'Overtime', 'Missing Check-Out', 'Corrected']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['date', 'checkIn', 'workedMinutes', 'status']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const correctAttendanceSchema = z.object({
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'checkIn must be a valid ISO datetime string',
  }),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'checkOut must be a valid ISO datetime string',
  }).nullable().optional(),
  correctionReason: z.string().trim().min(1, 'correctionReason is required and cannot be empty'),
}).refine((data) => {
  if (data.checkOut) {
    return new Date(data.checkOut).getTime() > new Date(data.checkIn).getTime();
  }
  return true;
}, {
  message: 'checkOut must be after checkIn',
  path: ['checkOut'],
});
