import React from 'react';
import { AttendanceOverview as AttendanceData } from '../types/dashboard.types';

interface AttendanceOverviewProps {
  data: AttendanceData;
}

export const AttendanceOverview: React.FC<AttendanceOverviewProps> = ({ data }) => {
  const getHealthColor = (pct: number) => {
    if (pct >= 90) return '#10b981';
    if (pct >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const healthColor = getHealthColor(data.coveragePercent);

  const metrics = [
    { label: 'Present', value: data.present, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Late', value: data.late, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Absent', value: data.absent, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Overtime', value: data.overtime, color: '#6366f1', bg: '#eef2ff' },
    { label: 'Missing Check-Outs', value: data.missingCheckOuts, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Manual Edits', value: data.manualEdits, color: '#64748b', bg: '#f1f5f9' },
  ];

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Attendance Overview
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Scheduled compliance and operational attendance logs
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: healthColor }}>
            {data.coveragePercent}%
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Coverage Health</span>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '8px',
          background: '#f1f5f9',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, data.coveragePercent))}%`,
            height: '100%',
            background: healthColor,
            borderRadius: '4px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: m.bg,
              padding: '14px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              {m.label}
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: m.color, marginTop: '6px' }}>
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AttendanceOverview;
