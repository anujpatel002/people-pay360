export type ContractStatus = 'New' | 'Running' | 'Expired' | 'Cancelled';

export interface Contract {
  id: string;
  employeeId: string;
  employeeName?: string;
  contractRef?: string;
  status: ContractStatus;
  department?: string;
  jobPosition?: string;
  wage: number;
  startDate: string;
  endDate?: string | null;
  scheduleId?: string;
  scheduleName?: string;
  structureId?: string;
  structureName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractFormValues {
  employeeId: string;
  contractRef?: string;
  status: ContractStatus;
  department?: string;
  jobPosition?: string;
  wage: number;
  startDate: string;
  endDate?: string | null;
  scheduleId?: string;
  structureId?: string;
  notes?: string;
}

export interface ContractLookups {
  employees: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    employeeNumber?: string;
    departmentName?: string;
    jobTitle?: string;
    scheduleId?: string;
    companyId?: string;
    workEmail?: string;
  }[];
  departments: { id: string; name: string; code: string }[];
  schedules: { id: string; name: string; weeklyHours: number; company?: string; timezone?: string }[];
  structures: { id: string; name: string; isActive: boolean }[];
  jobPositions: { title: string; departmentName?: string }[];
}
