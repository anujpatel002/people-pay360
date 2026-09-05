import { DayPattern } from '../validators/working-schedules.validator';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function calculateWeeklyHours(days: DayPattern[]): number {
  let total = 0;
  for (const d of days) {
    if (!d.active || !d.start || !d.end) continue;
    const startMin = timeToMinutes(d.start);
    const endMin   = timeToMinutes(d.end);
    if (endMin <= startMin) throw new Error(`End time must be after start time for ${d.day}`);
    const shiftMin = endMin - startMin - d.breakMinutes;
    if (shiftMin <= 0) throw new Error(`Break duration exceeds shift duration for ${d.day}`);
    total += shiftMin;
  }
  return Math.round((total / 60) * 100) / 100;
}
