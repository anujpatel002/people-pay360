import { useState, useEffect, useCallback } from 'react';
import { dashboardSavedViewService, CreateSavedViewDto } from '../services/dashboard-saved-view.service';
import { DashboardSavedView } from '../types/dashboard.types';

export function useDashboardSavedViews() {
  const [savedViews, setSavedViews] = useState<DashboardSavedView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedViews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const views = await dashboardSavedViewService.getSavedViews();
      setSavedViews(views);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load saved views');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedViews();
  }, [fetchSavedViews]);

  const saveView = async (data: CreateSavedViewDto): Promise<DashboardSavedView> => {
    const created = await dashboardSavedViewService.createSavedView(data);
    await fetchSavedViews();
    return created;
  };

  const removeView = async (id: string): Promise<void> => {
    await dashboardSavedViewService.deleteSavedView(id);
    await fetchSavedViews();
  };

  return {
    savedViews,
    loading,
    error,
    refreshSavedViews: fetchSavedViews,
    saveView,
    removeView,
  };
}
