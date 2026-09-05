import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStructures } from '../hooks/usePayrollConfig';
import { deleteStructure } from '../services/payroll-config.service';

export default function SalaryStructureListPage() {
  const navigate = useNavigate();
  const [search, setSearch]     = useState('');
  const [isActive, setIsActive] = useState('');
  const { data, total, loading, error, refetch } = useStructures({
    search: search || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
  });

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete structure "${name}"?`)) return;
    try { await deleteStructure(id); refetch(); }
    catch (err: unknown) {
      alert((err as any)?.response?.data?.error ?? 'Cannot delete structure');
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Salary Structures</h2>
        <button style={s.btnPrimary} onClick={() => navigate('/payroll-config/structures/new')}>+ New Structure</button>
      </div>

      <div style={s.filters}>
        <input style={s.input} placeholder="Search structures…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={s.select} value={isActive} onChange={(e) => setIsActive(e.target.value)}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {loading && <p style={s.muted}>Loading…</p>}
      {error   && <p style={s.err}>{error}</p>}

      {!loading && !error && (
        <>
          <table style={s.table}>
            <thead>
              <tr>{['Name', 'Rules', 'Contracts', 'Status', 'Actions'].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((str) => (
                <tr key={str.id} style={s.tr}>
                  <td style={s.td}><strong>{str.name}</strong></td>
                  <td style={s.td}>{str.ruleCount}</td>
                  <td style={s.td}>{str.employeeCount}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: str.isActive ? '#dcfce7' : '#fee2e2', color: str.isActive ? '#166534' : '#991b1b' }}>
                      {str.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button style={s.btnLink} onClick={() => navigate(`/payroll-config/structures/${str.id}`)}>Edit</button>
                    <button style={{ ...s.btnLink, color: '#dc2626' }} onClick={() => handleDelete(str.id, str.name)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!data.length && <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#9ca3af' }}>No structures found</td></tr>}
            </tbody>
          </table>
          <p style={s.muted}>{total} structure{total !== 1 ? 's' : ''} total</p>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 900, margin: '0 auto' },
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
  muted: { color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' },
  err: { color: '#dc2626' },
};
