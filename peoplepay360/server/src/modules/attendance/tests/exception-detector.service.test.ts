import { describe, it, expect } from '@jest/globals';
import { detectAttendanceStatus } from '../services/exception-detector.service';

describe('exception-detector.service', () => {
  it('should return Corrected if isManualEntry is true', () => {
    const status = detectAttendanceStatus({
      checkIn: '2026-09-05T09:00:00Z',
      checkOut: '2026-09-05T18:00:00Z',
      isManualEntry: true,
    });
    expect(status).toBe('Corrected');
  });

  it('should return Present for open session within working hours', () => {
    const status = detectAttendanceStatus({
      checkIn: '2026-09-05T08:55:00Z',
      checkOut: null,
      dayConfig: { day: 'monday', active: true, start: '09:00', end: '23:59', breakMinutes: 60 },
      now: new Date('2026-09-05T12:00:00Z'),
    });
    expect(status).toBe('Present');
  });

  it('should detect Late when check-in is past scheduled start time plus grace', () => {
    // Scheduled start 09:00. Check-in 09:15 UTC -> Late.
    const status = detectAttendanceStatus({
      checkIn: '2026-09-05T09:15:00Z',
      checkOut: '2026-09-05T18:05:00Z',
      dayConfig: { day: 'monday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      workedMinutes: 485,
      overtimeMinutes: 0,
    });
    expect(status).toBe('Late');
  });

  it('should detect Overtime when overtimeMinutes > 0 and not late', () => {
    const status = detectAttendanceStatus({
      checkIn: '2026-09-05T08:58:00Z',
      checkOut: '2026-09-05T19:00:00Z',
      dayConfig: { day: 'monday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      workedMinutes: 542,
      overtimeMinutes: 62,
    });
    expect(status).toBe('Overtime');
  });

  it('should detect Present for on-time check-in and standard working day', () => {
    const status = detectAttendanceStatus({
      checkIn: '2026-09-05T09:00:00Z',
      checkOut: '2026-09-05T18:00:00Z',
      dayConfig: { day: 'monday', active: true, start: '09:00', end: '18:00', breakMinutes: 60 },
      workedMinutes: 480,
      overtimeMinutes: 0,
    });
    expect(status).toBe('Present');
  });
});
