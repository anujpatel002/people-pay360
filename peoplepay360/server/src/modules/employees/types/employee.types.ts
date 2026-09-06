export type EmployeeStatus = 'active' | 'archived';
export type EmploymentType = 'full_time' | 'part_time' | 'contractor';

export interface Employee {
  id: string;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  phone?: string;
  privateAddress?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
  jobTitle?: string;
  jobPositionId?: string;
  jobPositionName?: string;
  departmentId?: string;
  departmentName?: string;
  managerId?: string;
  managerName?: string;
  employmentType: EmploymentType;
  companyId?: string;
  companyName?: string;
  location?: string;
  scheduleId?: string;
  scheduleName?: string;
  hireDate: string;
  currentContractId?: string;
  bankAccount?: string;
  iban?: string;
  swift?: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
}

export interface EmployeeCreateInput {
  firstName: string;
  lastName: string;
  workEmail: string;
  phone?: string;
  privateAddress?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  jobTitle?: string;
  jobPositionId?: string;
  departmentId?: string;
  managerId?: string;
  employmentType: EmploymentType;
  companyId?: string;
  location?: string;
  scheduleId?: string;
  hireDate: string;
  bankAccount?: string;
  iban?: string;
  swift?: string;
}

export type EmployeeUpdateInput = Partial<EmployeeCreateInput>;

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  jobPositionId?: string;
  managerId?: string;
  companyId?: string;
  location?: string;
  scheduleId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SmartCounts {
  employeeId: string;
  contracts: number;
  attendance: number;
  timeOff: number;
  allocations: number;
}
