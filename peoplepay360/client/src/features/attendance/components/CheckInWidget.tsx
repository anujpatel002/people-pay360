import React from 'react';
import { useCheckInOut } from '../hooks/useCheckInOut';
import AttendanceStatusBadge from './AttendanceStatusBadge';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

interface Props {
  onStatusChange?: () => void;
}

export default function CheckInWidget({ onStatusChange }: Props) {
  const { role, user } = useCurrentUser();
  const {
    openSession,
    loading,
    actionLoading,
    error,
    formattedElapsed,
    handleCheckIn,
    handleCheckOut,
  } = useCheckInOut(onStatusChange);

  if (role === 'Admin') {
    return (
      <div
        className="app-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 22px',
          flexWrap: 'wrap',
          gap: '14px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderColor: '#e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>System Administrator Attendance Mode</strong>
              <span className="app-badge app-badge-info" style={{ fontSize: '11px' }}>Punch-Clock Exempt</span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Logged in as <strong>{user?.name || 'Administrator'}</strong>. Administrative accounts are exempt from daily shift check-in / check-out clocks. Use this portal for organization-wide monitoring, anomaly reviews, and corrections.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="app-badge app-badge-success" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}>
            ● Full Oversight Access
          </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-card" style={{ padding: '16px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        Loading attendance punch widget...
      </div>
    );
  }

  const isCheckedIn = Boolean(openSession);

  return (
    <div
      className="app-card"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 22px',
        flexWrap: 'wrap',
        gap: '14px',
        background: isCheckedIn
          ? 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)'
          : '#ffffff',
        borderColor: isCheckedIn ? '#a7f3d0' : 'var(--app-card-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isCheckedIn ? '#10b981' : '#94a3b8',
              boxShadow: isCheckedIn ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none',
              animation: isCheckedIn ? 'dashPulse 2s infinite ease-in-out' : 'none',
            }}
          />
          <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
            {isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </span>
        </div>

        {isCheckedIn && openSession && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>
              Since {new Date(openSession.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span
              style={{
                fontFamily: 'var(--app-font)',
                fontWeight: 800,
                fontSize: '13px',
                padding: '3px 8px',
                background: '#e0e7ff',
                borderRadius: '6px',
                color: '#4338ca',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ⏱ {formattedElapsed}
            </span>
            <AttendanceStatusBadge status={openSession.status} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {error && (
          <span style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: 600 }}>
            {error}
          </span>
        )}

        {isCheckedIn ? (
          <button
            type="button"
            className="app-btn app-btn-danger"
            onClick={handleCheckOut}
            disabled={actionLoading}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            {actionLoading ? 'Checking Out...' : 'Check Out Now'}
          </button>
        ) : (
          <button
            type="button"
            className="app-btn"
            style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '8px 18px', fontSize: '13px' }}
            onClick={handleCheckIn}
            disabled={actionLoading}
          >
            {actionLoading ? 'Checking In...' : 'Check In Now'}
          </button>
        )}
      </div>
    </div>
  );
}
