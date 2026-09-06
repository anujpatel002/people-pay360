import { useState, useEffect } from 'react';
import { EmployeeFilters, EmployeeStatus, EmploymentType } from '../types/employee.types';

interface Props {
  filters: EmployeeFilters;
  onChange: (patch: Partial<EmployeeFilters>) => void;
  onReset?: () => void;
}

export default function EmployeeFiltersBar({ filters, onChange, onReset }: Props) {
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

  useEffect(() => {
    setSearchTerm(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search ?? '')) {
        onChange({ search: searchTerm || undefined });
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onChange, filters.search]);

  const hasFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.employmentType ||
    (filters.sortBy && filters.sortBy !== 'last_name') ||
    (filters.sortOrder && filters.sortOrder !== 'asc')
  );

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
      {/* Search Input with Icon */}
      <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '300px' }}>
        <input
          placeholder="Search name, email, emp #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="app-input"
          style={{ width: '100%', paddingLeft: '34px' }}
        />
        <div
          style={{
            position: 'absolute',
            left: '11px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            display: 'flex',
            pointerEvents: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <select
        value={filters.status ?? ''}
        onChange={(e) => onChange({ status: (e.target.value as EmployeeStatus) || undefined })}
        className="app-select"
        style={{ minWidth: '140px' }}
      >
        <option value="">All Statuses</option>
        <option value="active">Active Personnel</option>
        <option value="archived">Archived Records</option>
      </select>

      <select
        value={filters.employmentType ?? ''}
        onChange={(e) => onChange({ employmentType: (e.target.value as EmploymentType) || undefined })}
        className="app-select"
        style={{ minWidth: '150px' }}
      >
        <option value="">All Employment Types</option>
        <option value="full_time">Full-Time Regular</option>
        <option value="part_time">Part-Time</option>
        <option value="contractor">Contractor / Consultant</option>
      </select>

      {/* Sort By Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 650 }}>Sort:</span>
        <select
          value={filters.sortBy ?? 'last_name'}
          onChange={(e) => onChange({ sortBy: e.target.value })}
          className="app-select"
          style={{ minWidth: '140px' }}
        >
          <option value="last_name">Last Name</option>
          <option value="first_name">First Name</option>
          <option value="employee_number">Employee #</option>
          <option value="work_email">Work Email</option>
          <option value="hire_date">Hire Date</option>
          <option value="status">Status</option>
        </select>
        <button
          type="button"
          onClick={() => onChange({ sortOrder: (filters.sortOrder ?? 'asc') === 'asc' ? 'desc' : 'asc' })}
          className="app-btn app-btn-secondary"
          style={{ padding: '7px 10px', fontSize: '12px' }}
          title={`Order: ${filters.sortOrder === 'desc' ? 'Descending' : 'Ascending'}`}
        >
          {(filters.sortOrder ?? 'asc') === 'asc' ? '↑ ASC' : '↓ DESC'}
        </button>
      </div>

      {hasFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="app-btn app-btn-secondary"
          style={{ padding: '7px 12px', fontSize: '12px', color: '#dc2626' }}
        >
          ✕ Clear Filters
        </button>
      )}
    </div>
  );
}
