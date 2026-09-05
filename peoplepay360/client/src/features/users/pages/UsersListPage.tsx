import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useDeactivateUser } from '../hooks/useUsers';
import { UserRole } from '@/shared/types/api.types';

const ROLES: UserRole[] = ['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];

export default function UsersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useUsers({ search: search || undefined, role: role || undefined, page, limit: 20 });
  const deactivate = useDeactivateUser();

  function handleDeactivate(id: string, name: string) {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    deactivate.mutate(id);
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.title}>Users</h2>
        <button style={s.btnPrimary} onClick={() => navigate('/users/new')}>+ New User</button>
      </div>

      <div style={s.filters}>
        <input
          style={s.input}
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select style={s.select} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {isLoading && <p style={s.info}>Loading…</p>}
      {isError && <p style={s.error}>Failed to load users.</p>}

      {data && (
        <>
          <table style={s.table}>
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Employee', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>{u.name}</td>
                  <td style={s.td}>{u.workEmail}</td>
                  <td style={s.td}><span style={s.badge}>{u.role}</span></td>
                  <td style={s.td}>{u.employeeName}</td>
                  <td style={s.td}>
                    <span style={{ ...s.status, background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#166534' : '#991b1b' }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button style={s.btnLink} onClick={() => navigate(`/users/${u.id}`)}>Edit</button>
                    {u.isActive && (
                      <button style={{ ...s.btnLink, color: '#dc2626' }} onClick={() => handleDeactivate(u.id, u.name)}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={s.pagination}>
            <button style={s.btnPage} disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
            <span style={s.pageInfo}>Page {page} of {totalPages} · {data.total} total</span>
            <button style={s.btnPage} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.4rem', fontWeight: 700 },
  filters: { display: 'flex', gap: '0.75rem', marginBottom: '1rem' },
  input: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem', width: 260 },
  select: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  badge: { background: '#ede9fe', color: '#5b21b6', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 },
  status: { padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 },
  btnPrimary: { padding: '0.55rem 1.1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  btnLink: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.85rem', marginRight: 8, padding: 0 },
  btnPage: { padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' },
  pagination: { display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' },
  pageInfo: { fontSize: '0.85rem', color: '#6b7280' },
  info: { color: '#6b7280' },
  error: { color: '#dc2626' },
};
