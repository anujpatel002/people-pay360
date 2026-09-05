import { AttendanceStatus } from '../models/attendance.model';
import { DayScheduleConfig } from '../types/attendance.types';

export function detectAttendanceStatus(params: {
  checkIn: Date | string;
  checkOut?: Date | string | null;
  dayConfig?: DayScheduleConfig | null;
  workedMinutes?: number | null;
  overtimeMinutes?: number;
  isManualEntry?: boolean;
}): AttendanceStatus {
  const {
    checkIn,
    checkOut,
    dayConfig,
    overtimeMinutes = 0,
    isManualEntry = false,
  } = params;

  if (isManualEntry) {
    return 'Corrected';
  }

  const inDate = new Date(checkIn);

  // 1. Missing Check-Out detection for open sessions past scheduled end
  if (!checkOut) {
    if (dayConfig && dayConfig.active && dayConfig.end) {
      const [endH, endM] = dayConfig.end.split(':').map(Number);
      const scheduledEnd = new Date(inDate);
      scheduledEnd.setUTCHours(endH, endM, 0, 0);

      // Add 30 minutes grace threshold
      const thresholdTime = scheduledEnd.getTime() + 30 * 60 * 1000;
      if (Date.now() > thresholdTime) {
        return 'Missing Check-Out';
      }
    }
    return 'Present';
  }

  // 2. Late detection
  if (dayConfig && dayConfig.active && dayConfig.start) {
    const [startH, startM] = dayConfig.start.split(':').map(Number);
    // Compare hours and minutes on the check-in timestamp
    const checkInMinutes = inDate.getUTCHours() * 60 + inDate.getUTCMinutes();
    const scheduledStartMinutes = startH * 60 + startM;

    // Grace period of 5 minutes before marking Late
    if (checkInMinutes > scheduledStartMinutes + 5) {
      return 'Late';
    }
  }

  // 3. Overtime detection
  if (overtimeMinutes > 0) {
    return 'Overtime';
  }

  return 'Present';
}
