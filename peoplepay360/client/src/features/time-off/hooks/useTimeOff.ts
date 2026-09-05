import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/time-off.service';
import { TimeOffType, Allocation, TimeOffRequest, BalanceResponse, PaginatedResult } from '../types';

// ─── Types hook ───────────────────────────────────────────────────────────────

export function useTimeOffTypes() {
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getTypes();
      setTypes(res.data);
    } catch { setError('Failed to load leave types'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: Partial<TimeOffType>) => { await api.createType(data); await load(); };
  const update = async (id: string, data: Partial<TimeOffType>) => { await api.updateType(id, data); await load(); };

  return { types, loading, error, create, update, reload: load };
}

// ─── Allocations hook ─────────────────────────────────────────────────────────

export function useAllocations(filters?: Record<string, string | number>) {
  const [result, setResult] = useState<PaginatedResult<Allocation>>({ data: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setResult(await api.getAllocations(filters));
    } catch { setError('Failed to load allocations'); }
    finally { setLoading(false); }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  const create = async (data: Partial<Allocation>) => { await api.createAllocation(data); await load(); };
  const update = async (id: string, data: Partial<Allocation>) => { await api.updateAllocation(id, data); await load(); };

  return { ...result, loading, error, create, update, reload: load };
}

// ─── Balance hook ─────────────────────────────────────────────────────────────

export function useBalance(employeeId: string | undefined) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    api.getBalance(employeeId)
      .then(setBalance)
      .finally(() => setLoading(false));
  }, [employeeId]);

  return { balance, loading };
}

// ─── Requests hook ────────────────────────────────────────────────────────────

export function useTimeOffRequests(filters?: Record<string, string | number>) {
  const [result, setResult] = useState<PaginatedResult<TimeOffRequest>>({ data: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setResult(await api.getRequests(filters));
    } catch { setError('Failed to load requests'); }
    finally { setLoading(false); }
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  const create  = async (data: Parameters<typeof api.createRequest>[0]) => { const r = await api.createRequest(data); await load(); return r; };
  const approve = async (id: string) => { await api.approveRequest(id); await load(); };
  const refuse  = async (id: string, reason: string) => { await api.refuseRequest(id, reason); await load(); };
  const cancel  = async (id: string) => { await api.cancelRequest(id); await load(); };

  return { ...result, loading, error, create, approve, refuse, cancel, reload: load };
}
