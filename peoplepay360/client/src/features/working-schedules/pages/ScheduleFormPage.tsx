import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSchedule } from '../hooks/useSchedules';
import { createSchedule, updateSchedule } from '../services/working-schedules.service';
import WeeklyPatternEditor, { computeWeeklyHours } from '../components/WeeklyPatternEditor';
import { DayPattern, DEFAULT_DAYS } from '../types';
import { getEmployeeLookups } from '@/features/employees/services/employees.service';
import { EmployeeLookups } from '@/features/employees/types/employee.types';

export default function ScheduleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();

  const { data: fetched, loading: fetchLoading } = useSchedule(isEdit ? id! : '');

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [days, setDays] = useState<DayPattern[]>(DEFAULT_DAYS);
  const [companies, setCompanies] = useState<EmployeeLookups['companies']>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployeeLookups()
      .then((lookups) => setCompanies(lookups.companies))
      .catch(() => setError('Failed to load company options'));
  }, []);

  useEffect(() => {
    if (fetched) {
      setName(fetched.name);
      setCompany(fetched.company);
      setTimezone(fetched.timezone);
      setDays(fetched.days);
    }
  }, [fetched]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await updateSchedule(id!, { name, company, timezone, days });
      } else {
        await createSchedule({ name, company, timezone, days });
      }
      navigate('/working-schedules');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Something went wrong';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && fetchLoading) {
    return (
      <div className="app-page">
        <div className="app-page-container" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading schedule details...
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-page-container" style={{ maxWidth: '880px' }}>
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => navigate('/working-schedules')}
                className="app-btn app-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ← Back
              </button>
              <h1 className="app-page-title">
                {isEdit ? `Edit Schedule: ${name || fetched?.name || ''}` : 'New Working Schedule'}
              </h1>
            </div>
            <p className="app-page-subtitle">
              Configure baseline shift hours, break durations, and company assignments
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13.5px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* General Information */}
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Schedule Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="app-form-group">
                <label className="app-label">Schedule Name *</label>
                <input
                  className="app-input"
                  placeholder="e.g. Standard 40h Full-Time"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Company *</label>
                <select
                  className="app-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                >
                  <option value="">-- Select Company --</option>
                  {company && !companies.some((item) => item.name === company) && (
                    <option value={company}>{company}</option>
                  )}
                  {companies.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="app-form-group">
                <label className="app-label">Timezone</label>
                <input
                  className="app-input"
                  placeholder="e.g. Asia/Kolkata or UTC"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

          {/* Weekly Pattern */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Weekly Shift Schedule
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Toggle active days and configure work shift start, end, and unpaid break times.
                </p>
              </div>
            </div>

            <WeeklyPatternEditor days={days} onChange={setDays} />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: 0 }} />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Total Weekly Hours:{' '}
              <strong style={{ color: '#0f172a' }}>{computeWeeklyHours(days)} hrs</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="app-btn app-btn-secondary"
                onClick={() => navigate('/working-schedules')}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="app-btn app-btn-primary" disabled={saving}>
                {saving ? 'Saving Schedule...' : isEdit ? 'Save Changes' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
