import { useState, useEffect } from 'react';
import { Employee, SmartCounts } from '../types/employee.types';
import * as service from '../services/employees.service';

interface UseEmployeeState {
  employee: Employee | null;
  smartCounts: SmartCounts;
  loading: boolean;
  error: string | null;
}

const DEFAULT_COUNTS: SmartCounts = { employeeId: '', contracts: 0, attendance: 0, timeOff: 0, allocations: 0 };

export function useEmployee(id: string | undefined) {
  const [state, setState] = useState<UseEmployeeState>({
    employee: null, smartCounts: DEFAULT_COUNTS, loading: true, error: null,
  });

  useEffect(() => {
    if (!id) { setState({ employee: null, smartCounts: DEFAULT_COUNTS, loading: false, error: null }); return; }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([service.getEmployee(id), service.getSmartCounts(id)])
      .then(([employee, smartCounts]) => {
        if (!cancelled) setState({ employee, smartCounts, loading: false, error: null });
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: 'Failed to load employee' }));
      });

    return () => { cancelled = true; };
  }, [id]);

  return state;
}
