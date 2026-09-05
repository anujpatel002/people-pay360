import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as attendanceService from '../services/attendance.service';
import * as attendanceRepo from '../repositories/attendance.repository';
import { AuthUser } from '../../../shared/types';
import { Attendance } from '../models/attendance.model';

describe('attendance.service', () => {
  const mockEmployeeUser: AuthUser = {
    id: 'user_emp_01',
    employeeId: 'emp_01',
    name: 'Vikram Singh',
    email: 'vikram.singh@company.com',
    role: 'Employee',
  };

  const mockHrUser: AuthUser = {
    id: 'user_hr_01',
    employeeId: 'emp_02',
    name: 'Priya Sharma',
    email: 'priya.sharma@company.com',
    role: 'HR Manager',
  };

  const sampleRecord: Attendance = {
    id: 'att_01',
    employeeId: 'emp_01',
    employeeName: 'Vikram Singh',
    scheduleId: 'sch_01',
    date: '2026-09-05',
    checkIn: '2026-09-05T09:00:00.000Z',
    checkOut: '2026-09-05T18:00:00.000Z',
    workedMinutes: 480,
    overtimeMinutes: 0,
    status: 'Present',
    isManualEntry: false,
    correctionReason: null,
    correctedBy: null,
    correctedAt: null,
    createdAt: '2026-09-05T09:00:00.000Z',
    updatedAt: '2026-09-05T18:00:00.000Z',
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('listAttendance', () => {
    it('should force employeeId filter for Employee role', async () => {
      const findAllSpy = jest.spyOn(attendanceRepo, 'findAll').mockResolvedValue({
        data: [sampleRecord],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await attendanceService.listAttendance(mockEmployeeUser, {
        employeeId: 'different_emp',
        page: 1,
        limit: 20,
      });

      expect(findAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: 'emp_01' })
      );
      expect(res.data).toHaveLength(1);
    });

    it('should allow HR Manager to query any employeeId', async () => {
      const findAllSpy = jest.spyOn(attendanceRepo, 'findAll').mockResolvedValue({
        data: [sampleRecord],
        total: 1,
        page: 1,
        limit: 20,
      });

      await attendanceService.listAttendance(mockHrUser, {
        employeeId: 'emp_other',
        page: 1,
        limit: 20,
      });

      expect(findAllSpy).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: 'emp_other' })
      );
    });
  });

  describe('getAttendanceRecord', () => {
    it('should deny access if Employee role views another employees record', async () => {
      jest.spyOn(attendanceRepo, 'findById').mockResolvedValue({
        ...sampleRecord,
        employeeId: 'emp_other',
      });

      await expect(
        attendanceService.getAttendanceRecord(mockEmployeeUser, 'att_01')
      ).rejects.toThrow('Access denied to other employee attendance records');
    });

    it('should allow Employee role to view their own record', async () => {
      jest.spyOn(attendanceRepo, 'findById').mockResolvedValue(sampleRecord);

      const record = await attendanceService.getAttendanceRecord(mockEmployeeUser, 'att_01');
      expect(record.id).toBe('att_01');
    });
  });

  describe('correctRecord', () => {
    it('should reject correction attempt by Employee role', async () => {
      await expect(
        attendanceService.correctRecord(mockEmployeeUser, 'att_01', {
          checkIn: '2026-09-05T09:00:00.000Z',
          correctionReason: 'Fixed clock',
        })
      ).rejects.toThrow('Employees cannot correct attendance records');
    });

    it('should reject correction without non-empty correctionReason', async () => {
      await expect(
        attendanceService.correctRecord(mockHrUser, 'att_01', {
          checkIn: '2026-09-05T09:00:00.000Z',
          correctionReason: '   ',
        })
      ).rejects.toThrow('correctionReason is required');
    });
  });
});
