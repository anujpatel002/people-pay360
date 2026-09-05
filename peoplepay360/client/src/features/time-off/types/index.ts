export interface TimeOffType {
  id: string;
  name: string;
  unit: 'days' | 'hours';
  allocationRequired: boolean;
  approvalMode: string;
  isPaid: boolean;
  workEntry: string | null;
  color: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  employeeId: string;
  employeeName?: string;
  typeId: string;
  typeName?: string;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  validityStart: string;
  validityEnd: string;
  approverId: string | null;
  approverName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  typeId: string;
  typeName?: string;
  allocationId: string | null;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string | null;
  refusalReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  typeId: string;
  typeName: string;
  unit: string;
  allocated: number | null;
  taken: number | null;
  remaining: number | null;
  validityEnd: string | null;
}

export interface BalanceResponse {
  employeeId: string;
  balances: Balance[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
