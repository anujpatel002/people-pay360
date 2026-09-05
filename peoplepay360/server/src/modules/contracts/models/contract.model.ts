import { RowDataPacket } from 'mysql2';
import { Contract } from './contract.types';
import { toDateOnly } from '../../../shared/utils/date-only';

export interface ContractRow extends RowDataPacket {
  id: string;
  employee_id: string;
  employee_name: string | null;
  contract_ref: string | null;
  status: string;
  department: string | null;
  job_position: string | null;
  wage: number;
  start_date: string | Date;
  end_date: string | Date | null;
  schedule_id: string | null;
  schedule_name: string | null;
  structure_id: string | null;
  structure_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function toContract(row: ContractRow): Contract {
  return {
    id:            row.id,
    employeeId:    row.employee_id,
    employeeName:  row.employee_name ?? undefined,
    contractRef:   row.contract_ref ?? undefined,
    status:        row.status as Contract['status'],
    department:    row.department ?? undefined,
    jobPosition:   row.job_position ?? undefined,
    wage:          Number(row.wage),
    startDate:     toDateOnly(row.start_date),
    endDate:       row.end_date == null ? null : toDateOnly(row.end_date),
    scheduleId:    row.schedule_id ?? undefined,
    scheduleName:  row.schedule_name ?? undefined,
    structureId:   row.structure_id ?? undefined,
    structureName: row.structure_name ?? undefined,
    notes:         row.notes ?? undefined,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}
