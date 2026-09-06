import { useEffect, useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

  useEffect(() => {
    setSearchTerm(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextSearch = searchTerm || undefined;
      if (nextSearch !== filters.search) onChange({ search: nextSearch });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const hasFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.employeeId ||
    (filters.sortBy && filters.sortBy !== 'date') ||
    (filters.sortOrder && filters.sortOrder !== 'desc')
  );

  return (
    <div className="app-filter-bar" style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '280px' }}>
          <input
            type="text"
            className="app-input"
            placeholder="Search employee or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <select
          className="app-select"
          value={filters.status ?? ''}
          onChange={(e) => onChange({ status: (e.target.value as AttendanceStatus) || undefined })}
          style={{ minWidth: '150px' }}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>From:</span>
          <input
            type="date"
            className="app-input"
            value={filters.dateFrom ?? ''}
            onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
            style={{ width: '135px', padding: '5px 8px', fontSize: '12.5px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>To:</span>
          <input
            type="date"
            className="app-input"
            value={filters.dateTo ?? ''}
            onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
            style={{ width: '135px', padding: '5px 8px', fontSize: '12.5px' }}
          />
        </div>

        {/* Sort Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Sort:</span>
          <select
            className="app-select"
            value={filters.sortBy ?? 'date'}
            onChange={(e) => onChange({ sortBy: e.target.value })}
            style={{ minWidth: '140px' }}
          >
            <option value="date">Date</option>
            <option value="employeeName">Employee Name</option>
            <option value="checkIn">Check In Time</option>
            <option value="workedMinutes">Worked Hours</option>
            <option value="overtimeMinutes">Overtime</option>
            <option value="status">Status</option>
          </select>
          <button
            type="button"
            onClick={() => onChange({ sortOrder: (filters.sortOrder ?? 'desc') === 'desc' ? 'asc' : 'desc' })}
            className="app-btn app-btn-secondary"
            style={{ padding: '7px 10px', fontSize: '12px' }}
            title={`Order: ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {(filters.sortOrder ?? 'desc') === 'asc' ? '↑ ASC' : '↓ DESC'}
          </button>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="app-btn app-btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', color: '#dc2626' }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
