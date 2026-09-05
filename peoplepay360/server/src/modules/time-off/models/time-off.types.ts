import { RowDataPacket } from 'mysql2';

// ─── Time Off Type ────────────────────────────────────────────────────────────

export interface TimeOffTypeRow extends RowDataPacket {
  id: string;
  name: string;
  unit: 'days' | 'hours';
  allocation_required: number;
  approval_mode: string;
  is_paid: number;
  work_entry: string | null;
  color: string | null;
  is_active: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

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

export function toTimeOffType(row: TimeOffTypeRow): TimeOffType {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    allocationRequired: Boolean(row.allocation_required),
    approvalMode: row.approval_mode,
    isPaid: Boolean(row.is_paid),
    workEntry: row.work_entry,
    color: row.color,
    isActive: Boolean(row.is_active),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Allocation ───────────────────────────────────────────────────────────────

export interface AllocationRow extends RowDataPacket {
  id: string;
  employee_id: string;
  employee_name: string | null;
  type_id: string;
  type_name: string | null;
  year: number;
  total_days: number;
  used_days: number;
  validity_start: string;
  validity_end: string;
  approver_id: string | null;
  approver_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
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

export function toAllocation(row: AllocationRow): Allocation {
  const total = Number(row.total_days);
  const used  = Number(row.used_days);
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name ?? undefined,
    typeId: row.type_id,
    typeName: row.type_name ?? undefined,
    year: row.year,
    totalDays: total,
    usedDays: used,
    remainingDays: Math.max(0, total - used),
    validityStart: row.validity_start,
    validityEnd: row.validity_end,
    approverId: row.approver_id,
    approverName: row.approver_name ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Request ──────────────────────────────────────────────────────────────────

export interface TimeOffRequestRow extends RowDataPacket {
  id: string;
  employee_id: string;
  employee_name: string | null;
  type_id: string;
  type_name: string | null;
  allocation_id: string | null;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string | null;
  refusal_reason: string | null;
  created_at: string;
  updated_at: string;
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

export function toTimeOffRequest(row: TimeOffRequestRow): TimeOffRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name ?? undefined,
    typeId: row.type_id,
    typeName: row.type_name ?? undefined,
    allocationId: row.allocation_id,
    startDate: row.start_date,
    endDate: row.end_date,
    days: Number(row.days),
    status: row.status,
    reason: row.reason,
    refusalReason: row.refusal_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
