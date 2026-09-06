import { useState, useEffect, useCallback } from 'react';
import { getOpenSession, checkIn, checkOut } from '../services/attendance.service';
import { Attendance } from '../types/attendance.types';

function fmt(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

function elapsed(sinceIso: string): string {
  const diff = Math.floor((Date.now() - new Date(sinceIso).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return [h > 0 ? `${h}h` : null, `${String(m).padStart(2, '0')}m`, `${String(s).padStart(2, '0')}s`]
    .filter(Boolean).join(' ');
}

export default function AttendanceClockWidget() {
  const [session, setSession] = useState<Attendance | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const s = await getOpenSession();
      setSession(s);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    try {
      const s = await checkIn();
      setSession(s);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError('');
    try {
      await checkOut();
      setSession(null);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const isClockedIn = !!session;

  return (
    <div
      style={{
        padding: '22px 24px',
        borderRadius: '16px',
        background: isClockedIn
          ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
          : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: isClockedIn
          ? '0 8px 24px -6px rgba(6,78,59,0.4)'
          : '0 8px 24px -6px rgba(30,27,75,0.35)',
        transition: 'all 0.4s ease',
      }}
    >
      {/* Left: Clock display */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
          {isClockedIn ? '🟢 Session Active' : '⚪ Not Clocked In'}
        </div>
        <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-0.02em', color: '#ffffff' }}>
          {fmt(now)}
        </div>
        {isClockedIn && session?.checkIn && (
          <div style={{ marginTop: '6px', fontSize: '12.5px', color: 'rgba(255,255,255,0.65)' }}>
            ⏱ Clocked in at{' '}
            <span style={{ fontWeight: 700, color: '#6ee7b7' }}>
              {new Date(session.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
            {' · '}
            <span style={{ fontWeight: 700, color: '#a7f3d0' }}>{elapsed(session.checkIn)}</span>
            {' elapsed'}
          </div>
        )}
        {!isClockedIn && !loading && (
          <div style={{ marginTop: '6px', fontSize: '12.5px', color: 'rgba(255,255,255,0.5)' }}>
            Today:{' '}
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        )}
      </div>

      {/* Right: Action */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        {error && (
          <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 600, maxWidth: '200px', textAlign: 'right' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
        ) : isClockedIn ? (
          <button
            onClick={handleCheckOut}
            disabled={actionLoading}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              border: '1.5px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => { if (!actionLoading) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
          >
            <span style={{ fontSize: '16px' }}>🔴</span>
            {actionLoading ? 'Clocking Out...' : 'Clock Out'}
          </button>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={actionLoading}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { if (!actionLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
          >
            <span style={{ fontSize: '16px' }}>🟢</span>
            {actionLoading ? 'Clocking In...' : 'Clock In'}
          </button>
        )}
      </div>
    </div>
  );
}
