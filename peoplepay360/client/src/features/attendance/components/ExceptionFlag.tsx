import React from 'react';
import { Attendance } from '../types/attendance.types';

interface Props {
  record: Attendance;
}

export default function ExceptionFlag({ record }: Props) {
  const flags: { label: string; tooltip: string; color: string }[] = [];

  if (record.status === 'Late') {
    flags.push({
      label: 'Late',
      tooltip: 'Check-in was past scheduled start time',
      color: '#d97706',
    });
  }

  if (record.status === 'Missing Check-Out') {
    flags.push({
      label: 'Missing Checkout',
      tooltip: 'Open check-in session is past scheduled shift end',
      color: '#ea580c',
    });
  }

  if (record.overtimeMinutes > 0) {
    flags.push({
      label: `+${record.overtimeMinutes}m OT`,
      tooltip: `${record.overtimeMinutes} minutes overtime worked`,
      color: '#2563eb',
    });
  }

  if (record.isManualEntry) {
    flags.push({
      label: 'Manual Edit',
      tooltip: record.correctionReason ? `Corrected: ${record.correctionReason}` : 'Manually modified',
      color: '#7c3aed',
    });
  }

  if (!flags.length) {
    return null;
  }

  return (
    <div style={{ display: 'inline-flex', gap: '0.25rem', flexWrap: 'wrap' }}>
      {flags.map((f, i) => (
        <span
          key={i}
          title={f.tooltip}
          style={{
            fontSize: '0.7rem',
            padding: '0.1rem 0.4rem',
            borderRadius: 4,
            fontWeight: 600,
            background: '#f8fafc',
            border: `1px solid ${f.color}40`,
            color: f.color,
            cursor: 'help',
          }}
        >
          {f.label}
        </span>
      ))}
    </div>
  );
}
