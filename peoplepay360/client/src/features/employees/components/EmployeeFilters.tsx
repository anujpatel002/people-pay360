import { useState, useEffect } from 'react';
import { EmployeeFilters, EmployeeStatus, EmploymentType } from '../types/employee.types';

interface Props {
  filters: EmployeeFilters;
  onChange: (patch: Partial<EmployeeFilters>) => void;
}

export default function EmployeeFiltersBar({ filters, onChange }: Props) {
  // 1. Local state to keep the input text highly responsive
  const [searchTerm, setSearchTerm] = useState(filters.search ?? '');

  // 2. Sync local state if the parent filters.search changes from the outside
  useEffect(() => {
    setSearchTerm(filters.search ?? '');
  }, [filters.search]);

  // 3. Debounce Effect: Wait for typing to stop before triggering parent onChange
  useEffect(() => {
    // Set a threshold time of 400 milliseconds
    const handler = setTimeout(() => {
      // Only call onChange if the value actually changed from the parent filter value
      if (searchTerm !== (filters.search ?? '')) {
        onChange({ search: searchTerm || undefined });
      }
    }, 400);

    // If the user types another character before 400ms passes, 
    // this cleanup function runs and resets the timer!
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onChange, filters.search]);

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Search Input using local state for typing */}
      <input
        placeholder="Search employees..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, minWidth: 200 }}
      />

      <select
        value={filters.status ?? ''}
        onChange={(e) => onChange({ status: (e.target.value as EmployeeStatus) || undefined })}
        style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
      >
        <option value="">Status ▼</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>

      <select
        value={filters.employmentType ?? ''}
        onChange={(e) => onChange({ employmentType: (e.target.value as EmploymentType) || undefined })}
        style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6 }}
      >
        <option value="">Employment Type ▼</option>
        <option value="full_time">Full-Time</option>
        <option value="part_time">Part-Time</option>
        <option value="contractor">Contractor</option>
      </select>
    </div>
  );
}
