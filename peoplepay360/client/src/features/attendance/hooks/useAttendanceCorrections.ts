import { useState, useEffect, useCallback } from 'react';
import { AttendanceCorrection } from '../types/attendance.types';
import { getCorrections } from '../services/attendance.service';

export function useAttendanceCorrections(attendanceId?: string) {
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCorrections = useCallback(() => {
    if (!attendanceId) {
      setCorrections([]);
      return;
    }
    setLoading(true);
    setError(null);
    getCorrections(attendanceId)
      .then(setCorrections)
      .catch((err) => setError(err?.response?.data?.error ?? 'Failed to load correction history'))
      .finally(() => setLoading(false));
  }, [attendanceId]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  return { corrections, loading, error, refetch: fetchCorrections };
}
