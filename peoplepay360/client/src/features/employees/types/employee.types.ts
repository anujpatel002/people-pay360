export type EmployeeStatus = 'active' | 'archived';
export type EmploymentType = 'full_time' | 'part_time' | 'contractor';

export interface CurrentContractSummary {
  id: string;
  referenceCode: string;
  startDate: string;
  endDate?: string;
  wage: number;
  structureId?: string;
  structureName?: string;
  status: 'draft' | 'active' | 'expired' | 'cancelled';
}

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
  currentContract?: CurrentContractSummary;
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

export interface EmployeeFormValues {
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

export interface SmartCounts {
  employeeId: string;
  contracts: number;
  attendance: number;
  timeOff: number;
  allocations: number;
}

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
