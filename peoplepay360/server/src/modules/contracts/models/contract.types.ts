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

export interface ContractFilters {
  employeeId?: string;
  status?: ContractStatus;
  page?: number;
  limit?: number;
}

export interface CreateContractInput {
  employeeId: string;
  contractRef?: string;
  status?: ContractStatus;
  department?: string;
  jobPosition?: string;
  wage: number;
  startDate: string;
  endDate?: string | null;
  scheduleId?: string;
  structureId?: string;
  notes?: string;
}

export type UpdateContractInput = Partial<CreateContractInput>;
