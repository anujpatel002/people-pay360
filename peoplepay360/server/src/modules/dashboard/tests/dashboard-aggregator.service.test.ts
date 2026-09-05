import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as dashboardAggregatorService from '../services/dashboard-aggregator.service';
import * as payrollRepo from '../repositories/dashboard-payroll.repository';
import * as attendanceRepo from '../repositories/dashboard-attendance.repository';
import * as timeoffRepo from '../repositories/dashboard-timeoff.repository';
import * as employeeRepo from '../repositories/dashboard-employee.repository';
import * as alertService from '../services/dashboard-alert.service';

jest.mock('../repositories/dashboard-payroll.repository');
jest.mock('../repositories/dashboard-attendance.repository');
jest.mock('../repositories/dashboard-timeoff.repository');
jest.mock('../repositories/dashboard-employee.repository');
jest.mock('../services/dashboard-alert.service');

describe('dashboard-aggregator.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates live operational metrics correctly across modules', async () => {
    (payrollRepo.getPayrollTotals as jest.MockedFunction<typeof payrollRepo.getPayrollTotals>).mockResolvedValue({
      totalNet: 2850000,
      payslipCount: 38,
    });

    (payrollRepo.getSalaryByDepartment as jest.MockedFunction<typeof payrollRepo.getSalaryByDepartment>).mockResolvedValue([
      { departmentId: 'dep_eng', department: 'Engineering', totalNet: 1200000, headcount: 16 },
      { departmentId: null, department: 'Unassigned', totalNet: 350000, headcount: 5 },
    ]);

    (payrollRepo.getMonthlySalaryTrend as jest.MockedFunction<typeof payrollRepo.getMonthlySalaryTrend>).mockResolvedValue([
      { period: '2024-01', totalNet: 2800000 },
      { period: '2024-02', totalNet: 2830000 },
      { period: '2024-03', totalNet: 2850000 },
    ]);

    (attendanceRepo.getAttendanceOverview as jest.MockedFunction<typeof attendanceRepo.getAttendanceOverview>).mockResolvedValue({
      present: 820,
      late: 34,
      absent: 12,
      overtime: 58,
      missingCheckOuts: 5,
      manualEdits: 9,
      coveragePercent: 94.2,
    });

    (timeoffRepo.getTimeOffOverview as jest.MockedFunction<typeof timeoffRepo.getTimeOffOverview>).mockResolvedValue({
      approvedDays: 47,
      pendingRequests: 8,
      balancesByType: [
        { typeId: 'tot_01', typeName: 'Annual Leave', totalRemaining: 312 },
        { typeId: 'tot_02', typeName: 'Sick Leave', totalRemaining: null },
      ],
    });

    (employeeRepo.getDepartmentHeadcounts as jest.MockedFunction<typeof employeeRepo.getDepartmentHeadcounts>).mockResolvedValue([
      { departmentId: 'dep_eng', department: 'Engineering', headcount: 16 },
      { departmentId: null, department: 'Unassigned', headcount: 5 },
    ]);

    (alertService.reconcileAlerts as jest.MockedFunction<typeof alertService.reconcileAlerts>).mockResolvedValue([
      {
        id: 'alert_001',
        type: 'MISSING_BANK_DETAILS',
        severity: 'WARNING',
        count: 3,
        message: '3 employees are missing bank details',
        blocking: false,
        status: 'OPEN',
      },
    ]);

    const result = await dashboardAggregatorService.getDashboardData({
      period: '2024-03',
      companyId: 'cmp_001',
    });

    expect(result.filters.period).toBe('2024-03');
    expect(result.filters.companyId).toBe('cmp_001');

    // KPI validations
    expect(result.kpis.totalNetSalaryPaid).toBe(2850000);
    expect(result.kpis.payslipsGenerated).toBe(38);
    expect(result.kpis.averageSalary).toBe(Math.round(2850000 / 38)); // 75000
    expect(result.kpis.approvedTimeOffDays).toBe(47);
    expect(result.kpis.attendanceHealthPercent).toBe(94.2);

    // Overviews
    expect(result.salaryByDepartment).toHaveLength(2);
    expect(result.departmentOverview).toHaveLength(2);
    expect(result.departmentOverview.find((d) => d.departmentId === 'dep_eng')?.monthlySalary).toBe(1200000);
    expect(result.departmentOverview.find((d) => d.departmentId === null)?.department).toBe('Unassigned');

    // Alerts
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0].type).toBe('MISSING_BANK_DETAILS');
  });

  it('calculates average salary as 0 when no payslips are generated', async () => {
    (payrollRepo.getPayrollTotals as jest.MockedFunction<typeof payrollRepo.getPayrollTotals>).mockResolvedValue({
      totalNet: 0,
      payslipCount: 0,
    });
    (payrollRepo.getSalaryByDepartment as jest.MockedFunction<typeof payrollRepo.getSalaryByDepartment>).mockResolvedValue([]);
    (payrollRepo.getMonthlySalaryTrend as jest.MockedFunction<typeof payrollRepo.getMonthlySalaryTrend>).mockResolvedValue([]);
    (attendanceRepo.getAttendanceOverview as jest.MockedFunction<typeof attendanceRepo.getAttendanceOverview>).mockResolvedValue({
      present: 0, late: 0, absent: 0, overtime: 0, missingCheckOuts: 0, manualEdits: 0, coveragePercent: 0,
    });
    (timeoffRepo.getTimeOffOverview as jest.MockedFunction<typeof timeoffRepo.getTimeOffOverview>).mockResolvedValue({
      approvedDays: 0, pendingRequests: 0, balancesByType: [],
    });
    (employeeRepo.getDepartmentHeadcounts as jest.MockedFunction<typeof employeeRepo.getDepartmentHeadcounts>).mockResolvedValue([]);
    (alertService.reconcileAlerts as jest.MockedFunction<typeof alertService.reconcileAlerts>).mockResolvedValue([]);

    const result = await dashboardAggregatorService.getDashboardData({});
    expect(result.kpis.averageSalary).toBe(0);
    expect(result.kpis.totalNetSalaryPaid).toBe(0);
  });

  it('strictly enforces Live Data Rule: throws error and does not return fake/mock data when repo fails', async () => {
    (payrollRepo.getPayrollTotals as jest.MockedFunction<typeof payrollRepo.getPayrollTotals>).mockRejectedValue(
      new Error('Connection lost')
    );

    await expect(dashboardAggregatorService.getDashboardData({})).rejects.toThrow(
      /Dashboard aggregation failed: Connection lost/
    );
  });
});
