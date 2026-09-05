import React from 'react';
import { AttendanceStatus } from '../types/attendance.types';

interface Props {
  status: AttendanceStatus;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: string; bg: string; color: string; border: string }
> = {
  Present: {
    label: 'Present',
    icon: '✓',
    bg: '#ecfdf5',
    color: '#065f46',
    border: '#a7f3d0',
  },
  Late: {
    label: 'Late',
    icon: '⏰',
    bg: '#fffbeb',
    color: '#92400e',
    border: '#fde68a',
  },
  Absent: {
    label: 'Absent',
    icon: '✕',
    bg: '#fef2f2',
    color: '#991b1b',
    border: '#fecaca',
  },
  Overtime: {
    label: 'Overtime',
    icon: '⚡',
    bg: '#eff6ff',
    color: '#1e40af',
    border: '#bfdbfe',
  },
  'Missing Check-Out': {
    label: 'Missing Check-Out',
    icon: '⚠',
    bg: '#fff7ed',
    color: '#9a3412',
    border: '#fed7aa',
  },
  Corrected: {
    label: 'Corrected',
    icon: '✎',
    bg: '#f5f3ff',
    color: '#5b21b6',
    border: '#ddd6fe',
  },
};

export default function AttendanceStatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    icon: '•',
    bg: '#f3f4f6',
    color: '#374151',
    border: '#e5e7eb',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.6rem',
        borderRadius: 9999,
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}
