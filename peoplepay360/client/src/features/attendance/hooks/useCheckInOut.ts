import { useState, useEffect, useCallback } from 'react';
import { Attendance } from '../types/attendance.types';
import { getOpenSession, checkIn, checkOut } from '../services/attendance.service';

export function useCheckInOut(onActionSuccess?: () => void) {
  const [openSession, setOpenSession] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchSession = useCallback(() => {
    setLoading(true);
    getOpenSession()
      .then((session) => {
        setOpenSession(session);
        if (session && session.checkIn) {
          const diff = Math.max(0, Math.floor((Date.now() - new Date(session.checkIn).getTime()) / 1000));
          setElapsedSeconds(diff);
        } else {
          setElapsedSeconds(0);
        }
      })
      .catch((err) => setError(err?.response?.data?.error ?? null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Real-time timer tick when open session exists
  useEffect(() => {
    if (!openSession) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(openSession.checkIn).getTime()) / 1000));
      setElapsedSeconds(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [openSession]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const created = await checkIn();
      setOpenSession(created);
      onActionSuccess?.();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await checkOut();
      setOpenSession(null);
      setElapsedSeconds(0);
      onActionSuccess?.();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const formatElapsed = () => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return {
    openSession,
    loading,
    actionLoading,
    error,
    elapsedSeconds,
    formattedElapsed: formatElapsed(),
    handleCheckIn,
    handleCheckOut,
    refetchSession: fetchSession,
  };
}
