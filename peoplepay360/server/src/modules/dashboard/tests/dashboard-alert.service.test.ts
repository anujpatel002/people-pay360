import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as alertService from '../services/dashboard-alert.service';
import * as alertRepo from '../repositories/dashboard-alert.repository';
import * as payrollRepo from '../repositories/dashboard-payroll.repository';
import * as contractRepo from '../repositories/dashboard-contract.repository';

jest.mock('../repositories/dashboard-alert.repository');
jest.mock('../repositories/dashboard-payroll.repository');
jest.mock('../repositories/dashboard-contract.repository');

describe('dashboard-alert.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reconciles alerts from operational data and triggers deduplicated upserts and auto-resolves', async () => {
    // 1 missing bank employee
    (payrollRepo.countMissingBankDetails as jest.MockedFunction<typeof payrollRepo.countMissingBankDetails>).mockResolvedValue([
      { employeeId: 'emp_01' },
    ]);
    // 0 duplicate payslips
    (payrollRepo.findDuplicatePayslips as jest.MockedFunction<typeof payrollRepo.findDuplicatePayslips>).mockResolvedValue([]);
    // 1 unvalidated payrun
    (payrollRepo.findUnvalidatedPayruns as jest.MockedFunction<typeof payrollRepo.findUnvalidatedPayruns>).mockResolvedValue([
      { payrunId: 'pr_01', status: 'Computed' },
    ]);
    // 1 expiring contract
    (contractRepo.findExpiringContracts as jest.MockedFunction<typeof contractRepo.findExpiringContracts>).mockResolvedValue([
      { contractId: 'ctr_01', employeeId: 'emp_02', companyId: 'cmp_01', endDate: '2026-09-30', employeeName: 'Alice' },
    ]);

    (alertRepo.upsertAlert as jest.MockedFunction<typeof alertRepo.upsertAlert>).mockResolvedValue();
    (alertRepo.autoResolveClearedAlerts as jest.MockedFunction<typeof alertRepo.autoResolveClearedAlerts>).mockResolvedValue();
    (alertRepo.getAlertSummaries as jest.MockedFunction<typeof alertRepo.getAlertSummaries>).mockResolvedValue([
      {
        id: 'alert_1',
        type: 'MISSING_BANK_DETAILS',
        severity: 'WARNING',
        count: 1,
        message: '1 employee is missing bank details',
        blocking: false,
        status: 'OPEN',
      },
    ]);

    const summaries = await alertService.reconcileAlerts('cmp_01');

    expect(summaries).toHaveLength(1);
    expect(alertRepo.upsertAlert).toHaveBeenCalledTimes(3); // 1 bank + 1 payrun + 1 contract
    expect(alertRepo.autoResolveClearedAlerts).toHaveBeenCalledWith(
      ['MISSING_BANK_DETAILS:emp_01'],
      'MISSING_BANK_DETAILS',
      'cmp_01'
    );
    expect(alertRepo.autoResolveClearedAlerts).toHaveBeenCalledWith(
      [],
      'DUPLICATE_PAYSLIP',
      'cmp_01'
    );
  });
});
