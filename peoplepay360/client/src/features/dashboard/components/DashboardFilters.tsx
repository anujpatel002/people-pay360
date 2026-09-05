import React from 'react';
import {
  DashboardFilters as FiltersType,
  DashboardDimensions,
  DashboardSavedView,
} from '../types/dashboard.types';
import SavedViewSelector from './SavedViewSelector';

interface DashboardFiltersProps {
  filters: FiltersType;
  dimensions: DashboardDimensions;
  savedViews: DashboardSavedView[];
  onChange: (newFilters: FiltersType) => void;
  onSaveCurrentView: (name: string, isDefault: boolean) => Promise<void>;
  onDeleteSavedView: (id: string) => Promise<void>;
  onApplySavedView: (view: DashboardSavedView) => void;
  onReset: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  filters,
  dimensions,
  savedViews,
  onChange,
  onSaveCurrentView,
  onDeleteSavedView,
  onApplySavedView,
  onReset,
}) => {
  const currentPeriod = filters.period || new Date().toISOString().slice(0, 7);

  const hasActiveFilters = Boolean(
    filters.companyId || filters.departmentId || filters.employmentType || (filters.period && filters.period !== new Date().toISOString().slice(0, 7))
  );

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
        {/* Period Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Period
          </label>
          <input
            type="month"
            value={currentPeriod}
            onChange={(e) => onChange({ ...filters, period: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1e293b',
              background: '#f8fafc',
              cursor: 'pointer',
              outline: 'none',
            }}
          />
        </div>

        {/* Company Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Company
          </label>
          <select
            value={filters.companyId || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                companyId: e.target.value || undefined,
                departmentId: undefined, // Reset dept when company changes
              })
            }
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#1e293b',
              background: '#f8fafc',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '150px',
            }}
          >
            <option value="">All Companies</option>
            {dimensions.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Department Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Department
          </label>
          <select
            value={filters.departmentId || ''}
            onChange={(e) => onChange({ ...filters, departmentId: e.target.value || undefined })}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#1e293b',
              background: '#f8fafc',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '150px',
            }}
          >
            <option value="">All Departments</option>
            {dimensions.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Type Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Employment Type
          </label>
          <select
            value={filters.employmentType || ''}
            onChange={(e) => onChange({ ...filters, employmentType: e.target.value || undefined })}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#1e293b',
              background: '#f8fafc',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '150px',
            }}
          >
            <option value="">All Types</option>
            {dimensions.employmentTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            style={{
              alignSelf: 'flex-end',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              height: '36px',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Saved Views integration */}
      <div style={{ alignSelf: 'flex-end' }}>
        <SavedViewSelector
          savedViews={savedViews}
          activeFilters={filters}
          onApplyView={onApplySavedView}
          onSaveCurrentView={onSaveCurrentView}
          onDeleteView={onDeleteSavedView}
        />
      </div>
    </div>
  );
};
export default DashboardFilters;
