import * as repo from '../repositories/working-schedules.repository';
import { calculateWeeklyHours } from './weekly-hours.calculator';
import { CreateScheduleInput, UpdateScheduleInput } from '../validators/working-schedules.validator';
import { NotFoundError, ValidationError } from '../../../shared/errors/AppError';

export interface ScheduleDTO {
  id: string;
  name: string;
  company: string;
  timezone: string;
  weeklyHours: number;
  isActive: boolean;
  days: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

function toDTO(row: repo.ScheduleRow): ScheduleDTO {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    timezone: row.timezone,
    weeklyHours: Number(row.weekly_hours),
    isActive: Boolean(row.is_active),
    days: typeof row.days === 'string' ? JSON.parse(row.days) : row.days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSchedules(filters: { search?: string; isActive?: boolean }) {
  const rows = await repo.findAll(filters);
  return { data: rows.map(toDTO), total: rows.length };
}

export async function getSchedule(id: string): Promise<ScheduleDTO> {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError('Schedule not found');
  return toDTO(row);
}

export async function createSchedule(input: CreateScheduleInput): Promise<ScheduleDTO> {
  const duplicate = await repo.findByNameAndCompany(input.name, input.company);
  if (duplicate) throw new ValidationError('A schedule with this name already exists for this company');

  const weeklyHours = calculateWeeklyHours(input.days);

  const id = await repo.create({
    name: input.name,
    company: input.company,
    timezone: input.timezone ?? 'UTC',
    weeklyHours,
    days: JSON.stringify(input.days),
  });

  const row = await repo.findById(id);
  return toDTO(row!);
}

export async function updateSchedule(id: string, input: UpdateScheduleInput): Promise<ScheduleDTO> {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Schedule not found');

  const weeklyHours = input.days ? calculateWeeklyHours(input.days) : undefined;

  await repo.update(id, {
    name: input.name,
    company: input.company,
    timezone: input.timezone,
    weeklyHours,
    days: input.days ? JSON.stringify(input.days) : undefined,
  });

  const updated = await repo.findById(id);
  return toDTO(updated!);
}

export async function deleteSchedule(id: string): Promise<void> {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Schedule not found');

  const referenced = await repo.isReferenced(id);
  if (referenced) throw new ValidationError('Schedule is referenced by one or more employees or contracts');

  await repo.remove(id);
}
