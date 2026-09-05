import { useState, useEffect, useCallback } from 'react';
import { SalaryStructure, SalaryStructureDetail, SalaryRule } from '../types';
import * as service from '../services/payroll-config.service';

export function useStructures(filters: { search?: string; isActive?: boolean } = {}) {
  const [data, setData]       = useState<SalaryStructure[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async (f: typeof filters) => {
    setLoading(true); setError(null);
    try {
      const res = await service.getStructures(f);
      setData(res.data); setTotal(res.total);
    } catch { setError('Failed to load structures'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(filters); }, [JSON.stringify(filters)]);
  return { data, total, loading, error, refetch: () => fetch(filters) };
}

export function useStructure(id: string) {
  const [data, setData]       = useState<SalaryStructureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    service.getStructure(id)
      .then(setData)
      .catch(() => setError('Failed to load structure'))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}

export function useRules(structureId: string) {
  const [data, setData]       = useState<SalaryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!structureId) { setData([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await service.getRules(structureId);
      setData(res.data);
    } catch { setError('Failed to load rules'); }
    finally { setLoading(false); }
  }, [structureId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}
