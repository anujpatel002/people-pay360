import httpClient from '@/shared/services/httpClient';
import { DashboardSavedView } from '../types/dashboard.types';

export interface CreateSavedViewDto {
  name: string;
  period?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  employmentType?: string | null;
  isDefault?: boolean;
}

export interface UpdateSavedViewDto {
  name?: string;
  period?: string | null;
  companyId?: string | null;
  departmentId?: string | null;
  employmentType?: string | null;
  isDefault?: boolean;
}

export const dashboardSavedViewService = {
  getSavedViews: async (): Promise<DashboardSavedView[]> => {
    const response = await httpClient.get<DashboardSavedView[]>('/dashboard/saved-views');
    return response.data;
  },

  getSavedView: async (id: string): Promise<DashboardSavedView> => {
    const response = await httpClient.get<DashboardSavedView>(`/dashboard/saved-views/${id}`);
    return response.data;
  },

  createSavedView: async (data: CreateSavedViewDto): Promise<DashboardSavedView> => {
    const response = await httpClient.post<DashboardSavedView>('/dashboard/saved-views', data);
    return response.data;
  },

  updateSavedView: async (id: string, data: UpdateSavedViewDto): Promise<DashboardSavedView> => {
    const response = await httpClient.patch<DashboardSavedView>(`/dashboard/saved-views/${id}`, data);
    return response.data;
  },

  deleteSavedView: async (id: string): Promise<void> => {
    await httpClient.delete(`/dashboard/saved-views/${id}`);
  },
};
