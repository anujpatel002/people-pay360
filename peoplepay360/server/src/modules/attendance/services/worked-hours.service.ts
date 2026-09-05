import { DayScheduleConfig } from '../types/attendance.types';

export interface WorkedHoursCalculation {
  grossMinutes: number | null;
  workedMinutes: number | null;
  overtimeMinutes: number;
  breakMinutes: number;
  scheduledMinutes: number;
}

export function calculateWorkedHours(params: {
  checkIn: Date | string;
  checkOut?: Date | string | null;
  dayConfig?: DayScheduleConfig | null;
  expectedMinutes?: number;
}): WorkedHoursCalculation {
  const { checkIn, checkOut, dayConfig, expectedMinutes = 480 } = params;

  if (!checkOut) {
    return {
      grossMinutes: null,
      workedMinutes: null,
      overtimeMinutes: 0,
      breakMinutes: dayConfig?.breakMinutes ?? 0,
      scheduledMinutes: expectedMinutes,
    };
  }

  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  let grossMinutes = Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60));
  if (grossMinutes < 0) {
    // Overnight adjustment if timestamps were somehow local and crossed midnight without date increment
    grossMinutes += 24 * 60;
  }
  grossMinutes = Math.max(0, grossMinutes);

  const configuredBreak = Number(dayConfig?.breakMinutes ?? 0);
  // Apply break if duration is sufficiently long (e.g. > configuredBreak)
  let breakDeduction = 0;
  if (grossMinutes > configuredBreak) {
    breakDeduction = configuredBreak;
  }

  const workedMinutes = Math.max(0, grossMinutes - breakDeduction);
  const overtimeMinutes = Math.max(0, workedMinutes - expectedMinutes);

  return {
    grossMinutes,
    workedMinutes,
    overtimeMinutes,
    breakMinutes: breakDeduction,
    scheduledMinutes: expectedMinutes,
  };
}
