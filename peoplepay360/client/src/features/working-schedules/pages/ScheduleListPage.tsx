import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { deleteSchedule } from '../services/working-schedules.service';

export default function ScheduleListPage() {
  const navigate = useNavigate();
  const [search, setSearch]     = useState('');
  const [isActive, setIsActive] = useState<string>('');
  const { data, total, loading, error, refetch } = useSchedules({
    search: search || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
  });

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete schedule "${name}"?`)) return;
    try {
      await deleteSchedule(id);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Cannot delete schedule';
      alert(msg);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Working Schedules</h2>
        <button style={s.btnPrimary} onClick={() => navigate('/working-schedules/new')}>+ New Schedule</button>
      </div>

      <div style={s.filters}>
        <input style={s.input} placeholder="Search name or company…" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select style={s.select} value={isActive} onChange={(e) => setIsActive(e.target.value)}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {loading && <p style={s.info}>Loading…</p>}
      {error   && <p style={s.error}>{error}</p>}

      {!loading && !error && (
        <>
          <table style={s.table}>
            <thead>
              <tr>
                {['Name', 'Company', 'Timezone', 'Weekly Hours', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((sch) => (
                <tr key={sch.id} style={s.tr}>
                  <td style={s.td}>{sch.name}</td>
                  <td style={s.td}>{sch.company}</td>
                  <td style={s.td}>{sch.timezone}</td>
                  <td style={s.td}><strong>{sch.weeklyHours}h</strong></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: sch.isActive ? '#dcfce7' : '#fee2e2', color: sch.isActive ? '#166534' : '#991b1b' }}>
                      {sch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button style={s.btnLink} onClick={() => navigate(`/working-schedules/${sch.id}`)}>Edit</button>
                    <button style={{ ...s.btnLink, color: '#dc2626' }} onClick={() => handleDelete(sch.id, sch.name)}>Delete</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#9ca3af' }}>No schedules found</td></tr>
              )}
            </tbody>
          </table>
          <p style={s.info}>{total} schedule{total !== 1 ? 's' : ''} total</p>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 1000, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.4rem', fontWeight: 700 },
  filters: { display: 'flex', gap: '0.75rem', marginBottom: '1rem' },
  input: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: 260 },
  select: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  badge: { padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 },
  btnPrimary: { padding: '0.55rem 1.1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  btnLink: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.85rem', marginRight: 8, padding: 0 },
  info: { color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' },
  error: { color: '#dc2626' },
};
