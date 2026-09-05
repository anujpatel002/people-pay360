import { EmployeeFilters, EmployeeStatus, EmploymentType } from '../types/employee.types';

interface Props {
  filters: EmployeeFilters;
  onChange: (patch: Partial<EmployeeFilters>) => void;
}

export default function EmployeeFiltersBar({ filters, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        placeholder="Search employees..."
        value={filters.search ?? ''}
        onChange={(e) => onChange({ search: e.target.value || undefined })}
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
