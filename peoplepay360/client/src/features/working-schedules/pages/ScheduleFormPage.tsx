import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSchedule } from '../hooks/useSchedules';
import { createSchedule, updateSchedule } from '../services/working-schedules.service';
import WeeklyPatternEditor, { computeWeeklyHours } from '../components/WeeklyPatternEditor';
import { DayPattern, DEFAULT_DAYS } from '../types';

export default function ScheduleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit  = !!id && id !== 'new';
  const navigate = useNavigate();

  const { data: existing, isLoading: loading } = { data: null, isLoading: false };
  const { data: fetched, loading: fetchLoading } = useSchedule(isEdit ? id! : '');

  const [name,     setName]     = useState('');
  const [company,  setCompany]  = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [days,     setDays]     = useState<DayPattern[]>(DEFAULT_DAYS);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

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
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Something went wrong';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && fetchLoading) return <p style={{ padding: '2rem', color: '#6b7280' }}>Loading…</p>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/working-schedules')}>← Back</button>
        <h2 style={s.title}>{isEdit ? 'Edit Schedule' : 'New Schedule'}</h2>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.row}>
          <label style={s.label}>
            Schedule Name
            <input style={s.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label style={s.label}>
            Company
            <input style={s.input} value={company} onChange={(e) => setCompany(e.target.value)} required />
          </label>
          <label style={s.label}>
            Timezone
            <input style={s.input} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </label>
        </div>

        <div>
          <p style={s.sectionLabel}>Weekly Pattern</p>
          <WeeklyPatternEditor days={days} onChange={setDays} />
        </div>

        <div style={s.summary}>
          Computed Weekly Hours: <strong>{computeWeeklyHours(days)}h</strong>
        </div>

        {error && <p style={s.error}>{error}</p>}

        <div style={s.actions}>
          <button type="button" style={s.btnSecondary} onClick={() => navigate('/working-schedules')}>Cancel</button>
          <button type="submit" style={s.btnPrimary} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 760, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.3rem', fontWeight: 700 },
  back: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.9rem', padding: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#fff', padding: '1.5rem', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 500, flex: 1, minWidth: 180 },
  input: { padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' },
  sectionLabel: { margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' },
  summary: { background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: 6, fontSize: '0.9rem', color: '#166534' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' },
  btnPrimary: { padding: '0.6rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  btnSecondary: { padding: '0.6rem 1.2rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  error: { margin: 0, color: '#dc2626', fontSize: '0.85rem' },
};
