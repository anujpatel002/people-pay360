import httpClient from '@/shared/services/httpClient';
import {
  DashboardFilters,
  DashboardPayload,
  DashboardDimensions,
  DashboardAlert,
} from '../types/dashboard.types';

export const dashboardService = {
  getDashboard: async (filters: DashboardFilters = {}): Promise<DashboardPayload> => {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.employmentType) params.append('employmentType', filters.employmentType);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await httpClient.get<DashboardPayload>(`/dashboard${query}`);
    return response.data;
  },

  getDimensions: async (companyId?: string): Promise<DashboardDimensions> => {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const response = await httpClient.get<DashboardDimensions>(`/dashboard/dimensions${query}`);
    return response.data;
  },

  getAlerts: async (companyId?: string, status?: string): Promise<DashboardAlert[]> => {
    const params = new URLSearchParams();
    if (companyId) params.append('companyId', companyId);
    if (status) params.append('status', status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await httpClient.get<DashboardAlert[]>(`/dashboard/alerts${query}`);
    return response.data;
  },

  updateAlertStatus: async (id: string, status: string): Promise<DashboardAlert> => {
    const response = await httpClient.patch<DashboardAlert>(`/dashboard/alerts/${id}`, { status });
    return response.data;
  },
};
