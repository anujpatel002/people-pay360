import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service';
import {
  DashboardFilters,
  DashboardPayload,
  DashboardDimensions,
} from '../types/dashboard.types';

export function useDashboardData(filters: DashboardFilters) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [dimensions, setDimensions] = useState<DashboardDimensions>({
    companies: [],
    departments: [],
    employmentTypes: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load dimension options
  const fetchDimensions = useCallback(async (companyId?: string) => {
    try {
      const dims = await dashboardService.getDimensions(companyId);
      setDimensions(dims);
    } catch (err: any) {
      console.error('Failed to load dimensions:', err);
    }
  }, []);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getDashboard(filters);
      setData(res);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to load dashboard data';
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters.period, filters.companyId, filters.departmentId, filters.employmentType]);

  useEffect(() => {
    fetchDimensions(filters.companyId);
  }, [filters.companyId, fetchDimensions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    dimensions,
    loading,
    error,
    refetch: fetchData,
  };
}
