export type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DayPattern {
  day: DayName;
  active: boolean;
  start: string | null;
  end: string | null;
  breakMinutes: number;
}

export interface WorkingSchedule {
  id: string;
  name: string;
  company: string;
  timezone: string;
  weeklyHours: number;
  isActive: boolean;
  days: DayPattern[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleFormValues {
  name: string;
  company: string;
  timezone: string;
  days: DayPattern[];
}

export const DEFAULT_DAYS: DayPattern[] = [
  { day: 'monday',    active: true,  start: '09:00', end: '18:00', breakMinutes: 60 },
  { day: 'tuesday',   active: true,  start: '09:00', end: '18:00', breakMinutes: 60 },
  { day: 'wednesday', active: true,  start: '09:00', end: '18:00', breakMinutes: 60 },
  { day: 'thursday',  active: true,  start: '09:00', end: '18:00', breakMinutes: 60 },
  { day: 'friday',    active: true,  start: '09:00', end: '18:00', breakMinutes: 60 },
  { day: 'saturday',  active: false, start: null,    end: null,    breakMinutes: 0  },
  { day: 'sunday',    active: false, start: null,    end: null,    breakMinutes: 0  },
];
