/**
 * dashboard-aggregator.service.ts
 * Central read-only operational aggregator for the Dashboard module.
 * Adheres strictly to the Live Data Rule (no demo/mock fallbacks; operational DB records only).
 */
import * as payrollRepo from '../repositories/dashboard-payroll.repository';
import * as attendanceRepo from '../repositories/dashboard-attendance.repository';
import * as timeoffRepo from '../repositories/dashboard-timeoff.repository';
import * as employeeRepo from '../repositories/dashboard-employee.repository';
import * as alertService from './dashboard-alert.service';
import {
  DashboardFilters,
  DashboardPayload,
  DashboardKPIs,
  DepartmentOverview,
} from '../types/dashboard.types';
import { UserRole } from '../../../shared/types';

export async function getDashboardData(filters: DashboardFilters, role?: UserRole): Promise<DashboardPayload> {
  const currentPeriod = filters.period || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const activeFilters: DashboardFilters = {
    ...filters,
    period: currentPeriod,
  };
  //console.log('[Dashboard] filters:', JSON.stringify(activeFilters));
  const canViewPayroll = role !== 'HR Manager';

  try {
    // Run operational queries concurrently
    const [
      payrollTotals,
      salaryByDepartment,
      monthlySalaryTrend,
      attendanceOverview,
      timeOffOverview,
      deptHeadcounts,
      alerts,
    ] = await Promise.all([
      canViewPayroll
        ? payrollRepo.getPayrollTotals(activeFilters)
        : Promise.resolve({ totalNet: 0, payslipCount: 0 }),
      canViewPayroll ? payrollRepo.getSalaryByDepartment(activeFilters) : Promise.resolve([]),
      canViewPayroll ? payrollRepo.getMonthlySalaryTrend(activeFilters) : Promise.resolve([]),
      attendanceRepo.getAttendanceOverview(activeFilters),
      timeoffRepo.getTimeOffOverview(activeFilters),
      employeeRepo.getDepartmentHeadcounts(activeFilters),
      alertService.reconcileAlerts(activeFilters.companyId),
    ]);

    // Calculate Average Salary based on selected payslip population
    const averageSalary = payrollTotals.payslipCount > 0
      ? Math.round(payrollTotals.totalNet / payrollTotals.payslipCount)
      : 0;

    const kpis: DashboardKPIs = {
      totalNetSalaryPaid: payrollTotals.totalNet,
      payslipsGenerated: payrollTotals.payslipCount,
      averageSalary,
      approvedTimeOffDays: timeOffOverview.approvedDays,
      attendanceHealthPercent: attendanceOverview.coveragePercent,
    };

    // Combine department headcount and salary into departmentOverview
    const deptMap = new Map<string, DepartmentOverview>();

    for (const d of deptHeadcounts) {
      const key = d.departmentId || '__unassigned__';
      deptMap.set(key, {
        departmentId: d.departmentId,
        department: d.department || 'Unassigned',
        headcount: d.headcount,
        monthlySalary: 0,
      });
    }

    for (const s of salaryByDepartment) {
      const key = s.departmentId || '__unassigned__';
      const existing = deptMap.get(key);
      if (existing) {
        existing.monthlySalary = s.totalNet;
        if (!existing.department || existing.department === 'Unassigned') {
          existing.department = s.department;
        }
      } else {
        deptMap.set(key, {
          departmentId: s.departmentId,
          department: s.department || 'Unassigned',
          headcount: s.headcount || 0,
          monthlySalary: s.totalNet,
        });
      }
    }

    const departmentOverview: DepartmentOverview[] = Array.from(deptMap.values()).sort(
      (a, b) => b.monthlySalary - a.monthlySalary || b.headcount - a.headcount
    );

    return {
      filters: activeFilters,
      kpis,
      salaryByDepartment,
      monthlySalaryTrend,
      alerts,
      attendanceOverview,
      timeOffOverview,
      departmentOverview,
    };
  } catch (error: any) {
    // Re-throw to ensure the Live Data Rule: fail visibly with 500 rather than showing fake/corrupt metrics
    throw new Error(`Dashboard aggregation failed: ${error?.message || 'Database error'}`);
  }
}
