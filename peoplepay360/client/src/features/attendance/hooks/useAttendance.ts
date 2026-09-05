import { useState, useEffect, useCallback } from 'react';
import { Attendance, AttendanceFilters } from '../types/attendance.types';
import { getAttendance } from '../services/attendance.service';
import { PaginatedResult } from '@/shared/types/api.types';

export function useAttendance(initialFilters: AttendanceFilters = {}) {
  const [filters, setFilters] = useState<AttendanceFilters>(initialFilters);
  const [result, setResult] = useState<PaginatedResult<Attendance>>({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(() => {
    setLoading(true);
    setError(null);
    getAttendance(filters)
      .then(setResult)
      .catch((err) => setError(err?.response?.data?.error ?? 'Failed to load attendance records'))
      .finally(() => setLoading(false));
  }, [
    filters.employeeId,
    filters.dateFrom,
    filters.dateTo,
    filters.status,
    filters.search,
    filters.page,
    filters.limit,
    filters.sortBy,
    filters.sortOrder,
  ]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const updateFilters = (newFilters: Partial<AttendanceFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return {
    ...result,
    filters,
    updateFilters,
    setPage,
    loading,
    error,
    refetch: fetchAttendance,
  };
}
