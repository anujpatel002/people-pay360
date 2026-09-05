import { useState, useEffect } from 'react';
import { Contract } from '../types/contract.types';
import { getActiveContract } from '../services/contracts.service';

export function useActiveContract(
  employeeId: string | undefined,
  periodStart: string | undefined,
  periodEnd: string | undefined
) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId || !periodStart || !periodEnd) return;
    setLoading(true);
    setError(null);
    getActiveContract(employeeId, periodStart, periodEnd)
      .then(setContract)
      .catch((err) => setError(err?.response?.data?.error ?? 'No active contract found'))
      .finally(() => setLoading(false));
  }, [employeeId, periodStart, periodEnd]);

  return { contract, loading, error };
}
