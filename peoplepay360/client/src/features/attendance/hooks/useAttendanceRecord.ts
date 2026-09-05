import { useState, useEffect, useCallback } from 'react';
import { Attendance } from '../types/attendance.types';
import { getAttendanceRecord } from '../services/attendance.service';

export function useAttendanceRecord(id?: string) {
  const [record, setRecord] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = useCallback(() => {
    if (!id) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getAttendanceRecord(id)
      .then(setRecord)
      .catch((err) => setError(err?.response?.data?.error ?? 'Failed to load record'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  return { record, loading, error, refetch: fetchRecord };
}
