import React from 'react';
import { AttendanceFilters, AttendanceStatus } from '../types/attendance.types';

interface Props {
  filters: AttendanceFilters;
  onChange: (newFilters: Partial<AttendanceFilters>) => void;
  onReset: () => void;
}

const STATUSES: AttendanceStatus[] = [
  'Present',
  'Late',
  'Absent',
  'Overtime',
  'Missing Check-Out',
  'Corrected',
];

export default function AttendanceFiltersBar({ filters, onChange, onReset }: Props) {
  return (
    <div style={styles.container}>
      <input
        type="text"
        placeholder="Search employee or notes..."
        value={filters.search ?? ''}
        onChange={(e) => onChange({ search: e.target.value || undefined })}
        style={styles.searchInput}
      />

      <select
        value={filters.status ?? ''}
        onChange={(e) => onChange({ status: e.target.value || undefined })}
        style={styles.select}
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div style={styles.dateGroup}>
        <label style={styles.dateLabel}>From:</label>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
          style={styles.dateInput}
        />
      </div>

      <div style={styles.dateGroup}>
        <label style={styles.dateLabel}>To:</label>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
          style={styles.dateInput}
        />
      </div>

      {(filters.search || filters.status || filters.dateFrom || filters.dateTo || filters.employeeId) && (
        <button onClick={onReset} style={styles.resetBtn}>
          Clear Filters
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  searchInput: {
    padding: '0.45rem 0.75rem',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    minWidth: 220,
  },
  select: {
    padding: '0.45rem 0.75rem',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    background: '#ffffff',
  },
  dateGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  dateLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: 500,
  },
  dateInput: {
    padding: '0.4rem 0.6rem',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
  },
  resetBtn: {
    padding: '0.4rem 0.75rem',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.8rem',
    color: '#475569',
    fontWeight: 500,
  },
};
