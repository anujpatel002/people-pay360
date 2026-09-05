import { describe, it, expect } from '@jest/globals';
import { calculateWorkedHours } from '../services/worked-hours.service';

describe('worked-hours.service', () => {
  it('should return null workedMinutes when checkOut is missing', () => {
    const res = calculateWorkedHours({
      checkIn: '2026-09-05T09:00:00Z',
      checkOut: null,
      dayConfig: { day: 'monday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      expectedMinutes: 480,
    });

    expect(res.grossMinutes).toBeNull();
    expect(res.workedMinutes).toBeNull();
    expect(res.overtimeMinutes).toBe(0);
    expect(res.breakMinutes).toBe(60);
    expect(res.scheduledMinutes).toBe(480);
  });

  it('should correctly calculate standard daytime shift with break deduction', () => {
    // 09:05 to 18:10 -> Gross 545 mins. Break 60 mins -> Worked 485 mins. Expected 480 -> Overtime 5 mins.
    const res = calculateWorkedHours({
      checkIn: '2026-09-05T09:05:00Z',
      checkOut: '2026-09-05T18:10:00Z',
      dayConfig: { day: 'monday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      expectedMinutes: 480,
    });

    expect(res.grossMinutes).toBe(545);
    expect(res.breakMinutes).toBe(60);
    expect(res.workedMinutes).toBe(485);
    expect(res.overtimeMinutes).toBe(5);
  });

  it('should calculate overtime when worked minutes exceed expected schedule', () => {
    // 08:58 to 18:02 -> Gross 544 mins. No break applied if breakMinutes 0 -> Overtime 64 mins on 480 expected.
    const res = calculateWorkedHours({
      checkIn: '2026-09-06T08:58:00Z',
      checkOut: '2026-09-06T18:02:00Z',
      dayConfig: { day: 'monday', active: true, start: '09:00', end: '17:00', breakMinutes: 0 },
      expectedMinutes: 480,
    });

    expect(res.grossMinutes).toBe(544);
    expect(res.workedMinutes).toBe(544);
    expect(res.overtimeMinutes).toBe(64);
  });

  it('should handle overnight shifts crossing midnight', () => {
    // 22:00 (day 1) to 06:00 (day 2) -> 8 hours = 480 mins. Break 0 -> 480 mins.
    const res = calculateWorkedHours({
      checkIn: '2026-09-05T22:00:00Z',
      checkOut: '2026-09-06T06:00:00Z',
      dayConfig: { day: 'monday', active: true, start: '22:00', end: '06:00', breakMinutes: 0 },
      expectedMinutes: 480,
    });

    expect(res.grossMinutes).toBe(480);
    expect(res.workedMinutes).toBe(480);
    expect(res.overtimeMinutes).toBe(0);
  });
});
