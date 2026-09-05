import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator';
import * as service from '../services/employees.service';
import { Employee } from '../types/employee.types';

const HR_ROLES = new Set(['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']);
const PAYROLL_ROLES = new Set(['HR Payroll User', 'HR Payroll Manager', 'Admin']);

function filterSensitiveFields(emp: Employee, role: string): Partial<Employee> {
  const result: Partial<Employee> = { ...emp };
  if (!PAYROLL_ROLES.has(role)) {
    delete result.bankAccount;
    delete result.iban;
    delete result.swift;
  }
  if (!HR_ROLES.has(role)) {
    delete result.privateAddress;
    delete result.emergencyContact;
    delete result.emergencyContactPhone;
  }
  return result;
}

export async function listEmployees(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { user } = req;
    const filters = {
      search:         req.query.search as string | undefined,
      departmentId:   req.query.departmentId as string | undefined,
      status:         req.query.status as string | undefined,
      employmentType: req.query.employmentType as string | undefined,
      jobPositionId:  req.query.jobPositionId as string | undefined,
      managerId:      req.query.managerId as string | undefined,
      companyId:      req.query.companyId as string | undefined,
      location:       req.query.location as string | undefined,
      scheduleId:     req.query.scheduleId as string | undefined,
      sortBy:         req.query.sortBy as string | undefined,
      sortOrder:      req.query.sortOrder as 'asc' | 'desc' | undefined,
      page:           req.query.page ? Number(req.query.page) : undefined,
      limit:          req.query.limit ? Number(req.query.limit) : undefined,
    } as Parameters<typeof service.getEmployees>[0];

    // Employees can only see their own record
    if (!HR_ROLES.has(user.role)) {
      if (!user.employeeId) { res.json({ data: [], total: 0, page: 1, limit: 20 }); return; }
      const emp = await service.getEmployee(user.employeeId);
      res.json({ data: [filterSensitiveFields(emp, user.role)], total: 1, page: 1, limit: 20 });
      return;
    }

    const result = await service.getEmployees(filters);
    res.json({ ...result, data: result.data.map((e) => filterSensitiveFields(e, user.role)) });
  } catch (err) { next(err); }
}

export async function getEmployee(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { user } = req;
    const emp = await service.getEmployee(req.params.id);

    if (!HR_ROLES.has(user.role) && emp.id !== user.employeeId) {
      res.status(403).json({ error: 'Forbidden' }); return;
    }

    res.json(filterSensitiveFields(emp, user.role));
  } catch (err) { next(err); }
}

export async function createEmployee(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
    const emp = await service.createEmployee(parsed.data, req.user.id);
    res.status(201).json(emp);
  } catch (err) { next(err); }
}

export async function updateEmployee(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const parsed = updateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.errors[0].message }); return; }
    const emp = await service.updateEmployee(req.params.id, parsed.data, req.user.id);
    res.json(filterSensitiveFields(emp, req.user.role));
  } catch (err) { next(err); }
}

export async function archiveEmployee(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    await service.archiveEmployee(req.params.id, req.user.id);
    res.json({ message: 'Employee archived', id: req.params.id });
  } catch (err) { next(err); }
}

export async function restoreEmployee(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const emp = await service.restoreEmployee(req.params.id);
    res.json({ message: 'Employee restored', id: emp.id, status: emp.status });
  } catch (err) { next(err); }
}

export async function getSmartCounts(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!HR_ROLES.has(user.role) && id !== user.employeeId) {
      res.status(403).json({ error: 'Forbidden' }); return;
    }

    const counts = await service.getSmartCounts(id);
    res.json(counts);
  } catch (err) { next(err); }
}
