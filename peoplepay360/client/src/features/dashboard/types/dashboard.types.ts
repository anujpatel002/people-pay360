// client/src/features/dashboard/types/dashboard.types.ts

export interface DashboardFilters {
  period?: string;           // 'YYYY-MM'
  companyId?: string;        // companies.id
  departmentId?: string;     // departments.id
  employmentType?: string; // employment_type.id
}

export interface DashboardKPIs {
  totalNetSalaryPaid: number;
  payslipsGenerated: number;
  averageSalary: number;
  approvedTimeOffDays: number;
  attendanceHealthPercent: number;
}

export interface SalaryByDepartment {
  departmentId: string | null;
  department: string;
  totalNet: number;
  headcount: number;
}

export interface MonthlySalaryTrend {
  period: string;
  totalNet: number;
}

export type AlertType =
  | 'MISSING_BANK_DETAILS'
  | 'DUPLICATE_PAYSLIP'
  | 'UNVALIDATED_PAYRUN'
  | 'EXPIRING_CONTRACT';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export interface DashboardAlertSummary {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  count: number;
  message: string;
  blocking: boolean;
  status: AlertStatus;
}

export interface DashboardAlert {
  id: string;
  companyId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  employeeId?: string | null;
  status: AlertStatus;
  blocking: boolean;
  metadata?: Record<string, unknown> | null;
  dedupKey: string;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceOverview {
  present: number;
  late: number;
  absent: number;
  overtime: number;
  missingCheckOuts: number;
  manualEdits: number;
  coveragePercent: number;
}

export interface TimeOffBalanceByType {
  typeId: string;
  typeName: string;
  totalRemaining: number | null;
}

export interface TimeOffOverview {
  approvedDays: number;
  pendingRequests: number;
  balancesByType: TimeOffBalanceByType[];
}

export interface DepartmentOverview {
  departmentId: string | null;
  department: string;
  headcount: number;
  monthlySalary: number;
}

export interface DashboardPayload {
  filters: DashboardFilters;
  kpis: DashboardKPIs;
  salaryByDepartment: SalaryByDepartment[];
  monthlySalaryTrend: MonthlySalaryTrend[];
  alerts: DashboardAlertSummary[];
  attendanceOverview: AttendanceOverview;
  timeOffOverview: TimeOffOverview;
  departmentOverview: DepartmentOverview[];
}

export interface DashboardSavedView {
  id: string;
  userId: string;
  name: string;
  period?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  employmentType?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  companyId: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface EmploymentType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface DashboardDimensions {
  companies: Company[];
  departments: Department[];
  employmentTypes: EmploymentType[];
}
