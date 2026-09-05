import { useState, useEffect, useCallback } from 'react';
import { PaginatedResult } from '@/shared/types/api.types';
import { Employee, EmployeeFilters } from '../types/employee.types';
import * as service from '../services/employees.service';

interface UseEmployeesState extends PaginatedResult<Employee> {
  loading: boolean;
  error: string | null;
}

export function useEmployees(initialFilters: EmployeeFilters = {}) {
  const [filters, setFilters] = useState<EmployeeFilters>(initialFilters);
  const [state, setState] = useState<UseEmployeesState>({
    data: [], total: 0, page: 1, limit: 20, loading: true, error: null,
  });

  const fetch = useCallback(async (f: EmployeeFilters) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await service.getEmployees(f);
      setState({ ...result, loading: false, error: null });
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Failed to load employees' }));
    }
  }, []);

  useEffect(() => { fetch(filters); }, [filters, fetch]);

  const updateFilters = useCallback((patch: Partial<EmployeeFilters>) => {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((f) => ({ ...f, page }));
  }, []);

  return { ...state, filters, updateFilters, setPage, refetch: () => fetch(filters) };
}
