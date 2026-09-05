import { useState, useEffect } from 'react';
import { Contract } from '../types/contract.types';
import { getContracts, ContractFilters } from '../services/contracts.service';
import { PaginatedResult } from '@/shared/types/api.types';

export function useContracts(filters: ContractFilters = {}) {
  const [result, setResult]   = useState<PaginatedResult<Contract>>({ data: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getContracts(filters)
      .then(setResult)
      .catch((err) => setError(err?.response?.data?.error ?? 'Failed to load contracts'))
      .finally(() => setLoading(false));
  }, [filters.employeeId, filters.status, filters.page, filters.limit]);

  return { ...result, loading, error };
}
