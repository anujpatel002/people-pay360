/**
 * dashboard-alert.service.ts
 * Alerts service: reconciles operational data into alerts, prevents duplicates,
 * and manages alert lifecycle.
 */
import * as alertRepo from '../repositories/dashboard-alert.repository';
import * as payrollRepo from '../repositories/dashboard-payroll.repository';
import * as contractRepo from '../repositories/dashboard-contract.repository';
import * as companyRepo from '../repositories/company.repository';
import {
  DashboardAlert,
  DashboardAlertSummary,
  AlertStatus,
} from '../types/dashboard.types';

export async function reconcileAlerts(companyId?: string): Promise<DashboardAlertSummary[]> {
  const activeCompanies = await companyRepo.findAll(true);
  const fallbackCompanyId = activeCompanies[0]?.id || '6ead8c86-a96e-11f1-b2f6-3a217fae9be6';
  
  let targetCompanyId = fallbackCompanyId;
  if (companyId) {
    const existing = await companyRepo.findById(companyId);
    if (existing) {
      targetCompanyId = existing.id;
    }
  }

  // 1. Reconcile Missing Bank Details
  const missingBankEmployees = await payrollRepo.countMissingBankDetails(companyId);
  const activeBankDedupKeys: string[] = [];

  for (const emp of missingBankEmployees) {
    const dedupKey = `MISSING_BANK_DETAILS:${emp.employeeId}`;
    activeBankDedupKeys.push(dedupKey);

    await alertRepo.upsertAlert({
      companyId: emp.companyId || targetCompanyId,
      type: 'MISSING_BANK_DETAILS',
      severity: 'WARNING',
      title: 'Missing Bank Details',
      message: 'Employee is missing bank account / IBAN information',
      entityType: 'Employee',
      entityId: emp.employeeId,
      employeeId: emp.employeeId,
      blocking: false,
      dedupKey,
    });
  }
  await alertRepo.autoResolveClearedAlerts(activeBankDedupKeys, 'MISSING_BANK_DETAILS', companyId);

  // 2. Reconcile Duplicate Payslips
  const duplicatePayslips = await payrollRepo.findDuplicatePayslips(companyId);
  const activeDupDedupKeys: string[] = [];

  for (const dup of duplicatePayslips) {
    const dedupKey = `DUPLICATE_PAYSLIP:${dup.payrunId}:${dup.employeeId}`;
    activeDupDedupKeys.push(dedupKey);

    await alertRepo.upsertAlert({
      companyId: dup.companyId || targetCompanyId,
      type: 'DUPLICATE_PAYSLIP',
      severity: 'CRITICAL',
      title: 'Duplicate Payslip Detected',
      message: 'Employee has multiple payslips in overlapping payrun periods',
      entityType: 'Payrun',
      entityId: dup.payrunId,
      employeeId: dup.employeeId,
      blocking: true,
      dedupKey,
    });
  }
  await alertRepo.autoResolveClearedAlerts(activeDupDedupKeys, 'DUPLICATE_PAYSLIP', companyId);

  // 3. Reconcile Unvalidated Payruns
  const unvalidatedPayruns = await payrollRepo.findUnvalidatedPayruns(companyId);
  const activePayrunDedupKeys: string[] = [];

  for (const pr of unvalidatedPayruns) {
    const dedupKey = `UNVALIDATED_PAYRUN:${pr.payrunId}`;
    activePayrunDedupKeys.push(dedupKey);

    await alertRepo.upsertAlert({
      companyId: pr.companyId || targetCompanyId,
      type: 'UNVALIDATED_PAYRUN',
      severity: 'WARNING',
      title: 'Unvalidated Payrun',
      message: `Payrun is currently in ${pr.status} state and requires validation`,
      entityType: 'Payrun',
      entityId: pr.payrunId,
      blocking: false,
      dedupKey,
    });
  }
  await alertRepo.autoResolveClearedAlerts(activePayrunDedupKeys, 'UNVALIDATED_PAYRUN', companyId);

  // 4. Reconcile Expiring Contracts (within 30 days)
  const expiringContracts = await contractRepo.findExpiringContracts(companyId, 30);
  const activeContractDedupKeys: string[] = [];

  for (const ctr of expiringContracts) {
    const dedupKey = `EXPIRING_CONTRACT:${ctr.contractId}`;
    activeContractDedupKeys.push(dedupKey);

    await alertRepo.upsertAlert({
      companyId: ctr.companyId || targetCompanyId,
      type: 'EXPIRING_CONTRACT',
      severity: 'WARNING',
      title: 'Expiring Contract',
      message: `Contract for ${ctr.employeeName} expires on ${ctr.endDate}`,
      entityType: 'Contract',
      entityId: ctr.contractId,
      employeeId: ctr.employeeId,
      blocking: false,
      dedupKey,
    });
  }
  await alertRepo.autoResolveClearedAlerts(activeContractDedupKeys, 'EXPIRING_CONTRACT', companyId);

  // Return aggregated summaries for the dashboard payload
  return alertRepo.getAlertSummaries(companyId);
}

export async function getAlertsList(filters: {
  companyId?: string;
  status?: AlertStatus;
  limit?: number;
}): Promise<DashboardAlert[]> {
  return alertRepo.getAlertsList(filters);
}

export async function updateAlertStatus(
  id: string,
  status: AlertStatus,
  userId?: string
): Promise<DashboardAlert | null> {
  return alertRepo.updateAlertStatus(id, status, userId);
}
