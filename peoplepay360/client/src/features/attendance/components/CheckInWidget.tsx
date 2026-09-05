import React from 'react';
import { useCheckInOut } from '../hooks/useCheckInOut';
import AttendanceStatusBadge from './AttendanceStatusBadge';

interface Props {
  onStatusChange?: () => void;
}

export default function CheckInWidget({ onStatusChange }: Props) {
  const {
    openSession,
    loading,
    actionLoading,
    error,
    formattedElapsed,
    handleCheckIn,
    handleCheckOut,
  } = useCheckInOut(onStatusChange);

  if (loading) {
    return (
      <div style={styles.card}>
        <span style={styles.muted}>Loading attendance widget...</span>
      </div>
    );
  }

  const isCheckedIn = Boolean(openSession);

  return (
    <div style={styles.card}>
      <div style={styles.left}>
        <div style={styles.indicatorContainer}>
          <span
            style={{
              ...styles.pulseDot,
              backgroundColor: isCheckedIn ? '#10b981' : '#9ca3af',
            }}
          />
          <span style={styles.statusLabel}>
            {isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </span>
        </div>

        {isCheckedIn && openSession && (
          <div style={styles.sessionDetails}>
            <span style={styles.timeInfo}>
              Since {new Date(openSession.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={styles.timerBadge}>⏱ {formattedElapsed}</span>
            <AttendanceStatusBadge status={openSession.status} />
          </div>
        )}
      </div>

      <div style={styles.right}>
        {error && <span style={styles.error}>{error}</span>}

        {isCheckedIn ? (
          <button
            style={styles.checkOutBtn}
            onClick={handleCheckOut}
            disabled={actionLoading}
          >
            {actionLoading ? 'Checking Out...' : 'Check Out'}
          </button>
        ) : (
          <button
            style={styles.checkInBtn}
            onClick={handleCheckIn}
            disabled={actionLoading}
          >
            {actionLoading ? 'Checking In...' : 'Check In'}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    marginBottom: '1.25rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    flexWrap: 'wrap',
  },
  indicatorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  statusLabel: {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: '#1e293b',
  },
  sessionDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.875rem',
  },
  timeInfo: {
    color: '#64748b',
  },
  timerBadge: {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: '0.9rem',
    padding: '0.15rem 0.5rem',
    background: '#f1f5f9',
    borderRadius: 5,
    color: '#0f172a',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  checkInBtn: {
    padding: '0.55rem 1.4rem',
    background: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: 7,
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)',
  },
  checkOutBtn: {
    padding: '0.55rem 1.4rem',
    background: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: 7,
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(239, 68, 68, 0.2)',
  },
  muted: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  error: {
    color: '#dc2626',
    fontSize: '0.8rem',
  },
};
