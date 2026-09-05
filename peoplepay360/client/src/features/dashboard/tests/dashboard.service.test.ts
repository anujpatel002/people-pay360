import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../services/dashboard.service';
import httpClient from '@/shared/services/httpClient';

vi.mock('@/shared/services/httpClient', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serializes query parameters correctly for getDashboard', async () => {
    (httpClient.get as any).mockResolvedValueOnce({
      data: {
        filters: { period: '2024-03', companyId: 'cmp_01' },
        kpis: { totalNetSalaryPaid: 1000 },
      },
    });

    const result = await dashboardService.getDashboard({
      period: '2024-03',
      companyId: 'cmp_01',
      departmentId: 'dep_01',
      employmentType: 'et_01',
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/dashboard?period=2024-03&companyId=cmp_01&departmentId=dep_01&employmentType=et_01'
    );
    expect(result.kpis.totalNetSalaryPaid).toBe(1000);
  });

  it('calls getDimensions with optional companyId', async () => {
    (httpClient.get as any).mockResolvedValueOnce({
      data: { companies: [], departments: [], employmentTypes: [] },
    });

    await dashboardService.getDimensions('cmp_01');

    expect(httpClient.get).toHaveBeenCalledWith('/dashboard/dimensions?companyId=cmp_01');
  });

  it('calls updateAlertStatus with PATCH /dashboard/alerts/:id', async () => {
    (httpClient.patch as any).mockResolvedValueOnce({
      data: { id: 'alert_1', status: 'ACKNOWLEDGED' },
    });

    const result = await dashboardService.updateAlertStatus('alert_1', 'ACKNOWLEDGED');

    expect(httpClient.patch).toHaveBeenCalledWith('/dashboard/alerts/alert_1', {
      status: 'ACKNOWLEDGED',
    });
    expect(result.status).toBe('ACKNOWLEDGED');
  });
});
