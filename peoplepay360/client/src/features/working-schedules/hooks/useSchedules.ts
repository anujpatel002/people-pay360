import { useState, useEffect, useCallback } from 'react';
import { WorkingSchedule } from '../types';
import * as service from '../services/working-schedules.service';

export function useSchedules(filters: { search?: string; isActive?: boolean } = {}) {
  const [data, setData]       = useState<WorkingSchedule[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async (f: typeof filters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.getSchedules(f);
      setData(result.data);
      setTotal(result.total);
    } catch {
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(filters); }, [JSON.stringify(filters)]);

  return { data, total, loading, error, refetch: () => fetch(filters) };
}

export function useSchedule(id: string) {
  const [data, setData]       = useState<WorkingSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    service.getSchedule(id)
      .then(setData)
      .catch(() => setError('Failed to load schedule'))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
}
