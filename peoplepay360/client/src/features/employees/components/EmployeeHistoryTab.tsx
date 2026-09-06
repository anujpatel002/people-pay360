import { useState, useEffect } from 'react';
import { getRequestsByEmployee } from '@/features/time-off/services/time-off.service';
import { TimeOffRequest } from '@/features/time-off/types';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { useNavigate } from 'react-router-dom';
import http from '@/shared/services/httpClient';
import { Payslip } from '@/features/payroll/types/payroll.types';

const PAYROLL_ROLES = ['HR Payroll User', 'HR Payroll Manager', 'Admin'];

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Draft:     { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  Confirmed: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Approved:  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  Refused:   { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  Cancelled: { bg: '#fafafa', color: '#9ca3af', border: '#e5e7eb' },
};

async function getPayslipsByEmployee(employeeId: string): Promise<Payslip[]> {
  const { data } = await http.get<{ data: Payslip[] }>('/payroll/payslips', { params: { employeeId, limit: 20 } });
  return data.data || [];
}

export default function EmployeeHistoryTab({ employeeId }: { employeeId: string }) {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const canViewPayroll = PAYROLL_ROLES.includes(user?.role ?? '');

  const [activeTab, setActiveTab] = useState<'leave' | 'payslips'>('leave');
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const jobs: Promise<unknown>[] = [
      getRequestsByEmployee(employeeId).then(r => setRequests(r.data || [])),
    ];
    if (canViewPayroll) {
      jobs.push(getPayslipsByEmployee(employeeId).then(p => setPayslips(p)));
    }
    Promise.all(jobs).finally(() => setLoading(false));
  }, [employeeId, canViewPayroll]);

  const formatCurrency = (v?: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="app-card" style={{ padding: '24px' }}>
      {/* Sub-tab header */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        {(['leave', ...(canViewPayroll ? ['payslips'] : [])] as ('leave' | 'payslips')[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
              background: 'none',
              color: activeTab === tab ? '#4f46e5' : '#64748b',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all 0.15s ease',
            }}
          >
            {tab === 'leave' ? `🏖 Leave Requests (${requests.length})` : `💰 Payslips (${payslips.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          Loading history...
        </div>
      ) : activeTab === 'leave' ? (
        requests.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
            No leave requests found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {requests.map((r) => {
              const s = STATUS_STYLE[r.status] || STATUS_STYLE['Draft'];
              return (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{r.typeName || 'Leave'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {r.startDate} → {r.endDate} · <strong style={{ color: '#475569' }}>{r.days}d</strong>
                      {r.reason && <span style={{ marginLeft: '6px', color: '#94a3b8', fontStyle: 'italic' }}>"{r.reason}"</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '8px', flexShrink: 0, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        )
      ) : (
        payslips.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
            No payslips issued yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {payslips.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/payslips/${p.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', gap: '12px', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>
                    Payslip — {p.period_start} to {p.period_end}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Net: <strong style={{ color: '#16a34a' }}>{formatCurrency(p.net)}</strong>
                    {' · '}Gross: {formatCurrency(p.gross)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="app-badge app-badge-success" style={{ fontSize: '11px' }}>{p.status}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
