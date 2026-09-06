import { EmployeeFormValues, EmployeeLookups } from '../types/employee.types';

interface Props {
  values: Partial<EmployeeFormValues>;
  onChange: (patch: Partial<EmployeeFormValues>) => void;
  readOnly?: boolean;
  lookups?: EmployeeLookups | null;
}

export default function EmployeeScheduleInfo({ values, onChange, readOnly, lookups }: Props) {
  const schedules = lookups?.schedules ?? [];

  return (
    <div className="app-form-section">
      <div className="app-form-section-header">
        <div>
          <h4 className="app-form-section-title">
            <span style={{ fontSize: '18px' }}>⏱️</span> Working Schedule & Shift Assignment
          </h4>
          <p className="app-form-section-subtitle">
            Assign standard weekly shift boundaries, work hours, attendance expectations, and weekend policy
          </p>
        </div>
      </div>

      <div className="app-form-grid">
        <div className="app-form-group app-form-group-full">
          <label className="app-label">Assigned Working Schedule</label>
          <select
            className="app-select"
            value={values.scheduleId ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange({ scheduleId: e.target.value || undefined })}
          >
            <option value="">Default Corporate Schedule (Standard 40h)</option>
            {schedules.map((sch) => (
              <option key={sch.id} value={sch.id}>
                {sch.name} — {sch.weeklyHours}h/week ({sch.company || 'Corporate'})
              </option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Specifies daily work shift timings, break periods, and total standard weekly hours.
          </span>
        </div>
      </div>
    </div>
  );
}

