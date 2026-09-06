import { RowDataPacket } from 'mysql2';
import { Employee } from '../types/employee.types';
import { toDateOnly } from '../../../shared/utils/date-only';

export interface EmployeeRow extends RowDataPacket {
  id: string;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  work_email: string;
  phone: string | null;
  private_address: string | null;   // TEXT
  emergency_contact: string | null;
  emergency_contact_phone: string | null;
  avatar_url: string | null;         // TEXT
  job_title: string | null;
  job_position_id: string | null;
  job_position_name?: string | null;
  department_id: string | null;
  department_name?: string | null;
  manager_id: string | null;
  manager_name?: string | null;
  employment_type: string;
  company_id: string | null;
  company_name?: string | null;
  location: string | null;
  schedule_id: string | null;
  schedule_name?: string | null;
  hire_date: string | Date;
  current_contract_id: string | null;
  bank_account: string | null;
  iban: string | null;
  swift: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
}

export function toEmployee(row: EmployeeRow): Employee {
  return {
    id:                   row.id,
    employeeNumber:       row.employee_number ?? undefined,
    firstName:            row.first_name,
    lastName:             row.last_name,
    workEmail:            row.work_email,
    phone:                row.phone ?? undefined,
    privateAddress:       row.private_address ?? undefined,
    emergencyContact:     row.emergency_contact ?? undefined,
    emergencyContactPhone:row.emergency_contact_phone ?? undefined,
    avatarUrl:            row.avatar_url ?? undefined,
    jobTitle:             row.job_title ?? undefined,
    jobPositionId:        row.job_position_id ?? undefined,
    jobPositionName:      row.job_position_name ?? undefined,
    departmentId:         row.department_id ?? undefined,
    departmentName:       row.department_name ?? undefined,
    managerId:            row.manager_id ?? undefined,
    managerName:          row.manager_name ?? undefined,
    employmentType:       row.employment_type as Employee['employmentType'],
    companyId:            row.company_id ?? undefined,
    companyName:          row.company_name ?? undefined,
    location:             row.location ?? undefined,
    scheduleId:           row.schedule_id ?? undefined,
    scheduleName:         row.schedule_name ?? undefined,
    hireDate:             toDateOnly(row.hire_date),
    currentContractId:    row.current_contract_id ?? undefined,
    bankAccount:          row.bank_account ?? undefined,
    iban:                 row.iban ?? undefined,
    swift:                row.swift ?? undefined,
    status:               row.status as Employee['status'],
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
    createdBy:            row.created_by ?? undefined,
    updatedBy:            row.updated_by ?? undefined,
    archivedAt:           row.archived_at ?? undefined,
    archivedBy:           row.archived_by ?? undefined,
  };
}
