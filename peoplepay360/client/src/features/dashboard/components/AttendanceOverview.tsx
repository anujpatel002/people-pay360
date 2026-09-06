import React from 'react';
import { AttendanceOverview as AttendanceData } from '../types/dashboard.types';

interface AttendanceOverviewProps {
  data: AttendanceData;
}

export const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({ data }) => {
  const getHealthColor = (pct: number) => {
    if (pct >= 90) return { text: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Optimal' };
    if (pct >= 75) return { text: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Moderate' };
    return { text: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Action Required' };
  };

  const health = getHealthColor(data.coveragePercent);

  const metrics = [
    { label: 'Present', value: data.present, color: '#059669', bg: '#ecfdf5', border: '#d1fae5' },
    { label: 'Late Arrival', value: data.late, color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
    { label: 'Absent', value: data.absent, color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' },
    { label: 'Overtime', value: data.overtime, color: '#4f46e5', bg: '#eef2ff', border: '#e0e7ff' },
    { label: 'Missing Check-Out', value: data.missingCheckOuts, color: '#b91c1c', bg: '#fef2f2', border: '#fee2e2' },
    { label: 'Manual Edits', value: data.manualEdits, color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
  ];

  return (
    <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
            Attendance Overview
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--dash-text-muted)' }}>
            Schedule compliance and operational attendance logs
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px',
              background: health.bg,
              padding: '4px 12px',
              borderRadius: '10px',
              border: `1px solid ${health.border}`,
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 800, color: health.text, fontVariantNumeric: 'tabular-nums' }}>
              {data.coveragePercent}%
            </span>
            <span style={{ fontSize: '11px', color: health.text, fontWeight: 700, textTransform: 'uppercase' }}>
              {health.label}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          background: '#f1f5f9',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, data.coveragePercent))}%`,
            height: '100%',
            background: data.coveragePercent >= 90
              ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
              : data.coveragePercent >= 75
                ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '9999px',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          flex: 1,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: m.bg,
              border: `1px solid ${m.border}`,
              padding: '14px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ fontSize: '12px', fontWeight: 650, color: '#475569' }}>
              {m.label}
            </span>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: m.color,
                marginTop: '6px',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceOverview;
