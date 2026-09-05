import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContracts } from '../hooks/useContracts';
import ActiveContractBadge from '../components/ActiveContractBadge';
import { ContractStatus } from '../types/contract.types';

const STATUSES: ContractStatus[] = ['New', 'Running', 'Expired', 'Cancelled'];

export default function ContractListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [employeeId] = useState(searchParams.get('employeeId') ?? undefined);
  const [status, setStatus]   = useState<string>('');
  const [page, setPage]       = useState(1);

  const { data, total, loading, error } = useContracts({ employeeId, status: status || undefined, page, limit: 20 });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Contracts</h2>
        <button style={styles.newBtn} onClick={() => navigate('/contracts/new')}>+ New</button>
      </div>

      <div style={styles.filters}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={styles.select}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : data.length === 0 ? (
        <p style={styles.muted}>No contracts found.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {['Ref', 'Employee', 'Start Date', 'End Date', 'Wage/Month', 'Status', ''].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} style={c.status === 'Running' ? styles.runningRow : undefined}>
                <td style={styles.td}>{c.contractRef ?? '—'}</td>
                <td style={styles.td}>{c.employeeName ?? c.employeeId}</td>
                <td style={styles.td}>{c.startDate}</td>
                <td style={styles.td}>{c.endDate ?? 'Open-ended'}</td>
                <td style={styles.td}>{c.wage.toLocaleString()}</td>
                <td style={styles.td}><ActiveContractBadge status={c.status} /></td>
                <td style={styles.td}>
                  <button style={styles.editBtn} onClick={() => navigate(`/contracts/${c.id}`)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={styles.pageBtn}>← Prev</button>
        <span style={styles.muted}>Page {page} — {total} total</span>
        <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} style={styles.pageBtn}>Next →</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:       { padding: '1.5rem 2rem' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title:      { margin: 0, fontSize: '1.25rem', fontWeight: 700 },
  newBtn:     { padding: '0.5rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
  filters:    { display: 'flex', gap: '0.75rem', marginBottom: '1rem' },
  select:     { padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.875rem' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { textAlign: 'left', padding: '0.6rem 0.75rem', borderBottom: '2px solid #e5e7eb', fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 },
  td:         { padding: '0.65rem 0.75rem', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' },
  runningRow: { background: '#f0fdf4' },
  editBtn:    { padding: '0.3rem 0.75rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 5, cursor: 'pointer', fontSize: '0.8rem' },
  pagination: { display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' },
  pageBtn:    { padding: '0.35rem 0.9rem', border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', background: '#fff' },
  muted:      { color: '#9ca3af', fontSize: '0.875rem' },
  error:      { color: '#dc2626', fontSize: '0.875rem' },
};
