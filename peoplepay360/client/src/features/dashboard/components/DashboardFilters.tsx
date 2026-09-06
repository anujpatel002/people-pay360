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

  const activeFilterCount = [
    Boolean(filters.companyId),
    Boolean(filters.departmentId),
    Boolean(filters.employmentType),
    Boolean(filters.period && filters.period !== new Date().toISOString().slice(0, 7)),
  ].filter(Boolean).length;

  return (
    <div className="dash-card dash-glass-panel" style={{ padding: '18px 24px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: Dimension Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
          {/* Period Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--dash-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Period
            </label>
            <input
              type="month"
              value={currentPeriod}
              onChange={(e) => onChange({ ...filters, period: e.target.value })}
              className="dash-input"
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                color: '#0f172a',
                padding: '7px 10px',
              }}
            />
          </div>

          {/* Company Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--dash-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
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
              className="dash-select"
              style={{ minWidth: '160px', padding: '7px 10px' }}
            >
              <option value="">All Companies</option>
              {dimensions.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currencyCode})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--dash-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Department
            </label>
            <select
              value={filters.departmentId || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  departmentId: e.target.value || undefined,
                })
              }
              className="dash-select"
              style={{ minWidth: '160px', padding: '7px 10px' }}
            >
              <option value="">All Departments</option>
              {dimensions.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--dash-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Employment Type
            </label>
            <select
              value={filters.employmentType || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  employmentType: e.target.value || undefined,
                })
              }
              className="dash-select"
              style={{ minWidth: '150px', padding: '7px 10px' }}
            >
              <option value="">All Types</option>
              <option value="full_time">Full-Time</option>
              <option value="part_time">Part-Time</option>
              <option value="contractor">Contractor</option>
            </select>
          </div>

          {/* Reset Filters Pill */}
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: '18px' }}>
              <button
                type="button"
                onClick={onReset}
                className="dash-btn dash-btn-secondary"
                style={{
                  padding: '7px 12px',
                  fontSize: '12px',
                  borderRadius: '10px',
                  color: '#64748b',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Reset ({activeFilterCount})
              </button>
            </div>
          )}
        </div>

        {/* Right: Saved Views & Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
          <SavedViewSelector
            savedViews={savedViews}
            activeFilters={filters}
            onApplyView={onApplySavedView}
            onSaveCurrentView={onSaveCurrentView}
            onDeleteView={onDeleteSavedView}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
