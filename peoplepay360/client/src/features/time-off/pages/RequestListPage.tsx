import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeOffRequests, useTimeOffTypes } from '../hooks/useTimeOff';
import ApprovalActions from '../components/ApprovalActions';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

const HR_ROLES = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];

const STATUS_COLOR: Record<string, string> = {
  Confirmed: '#2563eb', Approved: '#16a34a',
  Refused: '#ef4444', Cancelled: '#6b7280', Draft: '#9ca3af',
};

export default function RequestListPage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const isHR = HR_ROLES.includes(user?.role ?? '');

  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, total, loading, error, approve, refuse, reload } = useTimeOffRequests(filters);
  const { types } = useTimeOffTypes();

  const handleFilter = (key: string, val: string) =>
    setFilters(f => val ? { ...f, [key]: val } : Object.fromEntries(Object.entries(f).filter(([k]) => k !== key)));

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Leave Requests</h2>
        <button onClick={() => navigate('/time-off/requests/new')}
          style={{ padding: '7px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          + New Request
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {isHR && (
          <input placeholder="Employee ID" onChange={e => handleFilter('employeeId', e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }} />
        )}
        <select onChange={e => handleFilter('typeId', e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }}>
          <option value="">All Types</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select onChange={e => handleFilter('status', e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }}>
          <option value="">All Statuses</option>
          {['Draft', 'Confirmed', 'Approved', 'Refused', 'Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" onChange={e => handleFilter('dateFrom', e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }} />
        <input type="date" onChange={e => handleFilter('dateTo', e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }} />
      </div>

      {loading ? <p>Loading...</p> : error ? <p style={{ color: '#ef4444' }}>{error}</p> : (
        <>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Total: {total}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                {['Employee', 'Type', 'Start', 'End', 'Days', 'Status', 'Reason', ...(isHR ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px' }}>{r.employeeName ?? r.employeeId}</td>
                  <td style={{ padding: '10px 12px' }}>{r.typeName}</td>
                  <td style={{ padding: '10px 12px' }}>{r.startDate}</td>
                  <td style={{ padding: '10px 12px' }}>{r.endDate}</td>
                  <td style={{ padding: '10px 12px' }}>{r.days}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: STATUS_COLOR[r.status] ?? '#6b7280', fontWeight: 600 }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>
                    {r.refusalReason ? `Refused: ${r.refusalReason}` : (r.reason ?? '—')}
                  </td>
                  {isHR && (
                    <td style={{ padding: '10px 12px' }}>
                      <ApprovalActions requestId={r.id} status={r.status} onApprove={approve} onRefuse={refuse} />
                    </td>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No requests found</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
