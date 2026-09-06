import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPayslip } from '../services/payroll.service';
import { Payslip } from '../types/payroll.types';

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #payslip-print-area, #payslip-print-area * { visibility: visible !important; }
  #payslip-print-area {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    padding: 32px 40px !important;
    background: #ffffff !important;
    box-shadow: none !important;
    border: none !important;
    z-index: 9999 !important;
    page-break-inside: avoid;
  }
  .no-print { display: none !important; }
  @page {
    size: A4 portrait;
    margin: 16mm 14mm;
  }
}
`;

export default function PayslipDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState<Payslip>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inject print styles once on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'payslip-print-styles';
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
    return () => { document.getElementById('payslip-print-styles')?.remove(); };
  }, []);

  useEffect(() => {
    getPayslip(id)
      .then((data) => {
        setPayslip(data);
        setError(null);
      })
      .catch((err) => {
        setError(err?.response?.data?.error ?? 'Failed to load payslip');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="app-page">
        <div className="app-page-container" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading payslip...
        </div>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="app-page">
        <div className="app-page-container" style={{ textAlign: 'center', padding: '60px 0', color: '#dc2626' }}>
          {error ?? 'Payslip not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-page-container" style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="app-btn app-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ← Back
              </button>
              <h1 className="app-page-title">Salary Payslip</h1>
              <span className="app-badge app-badge-success">{payslip.status}</span>
            </div>
            <p className="app-page-subtitle">
              Detailed salary breakdown and deductions for <strong>{payslip.employee_name_snapshot}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }} className="no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="app-btn app-btn-secondary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Payslip
            </button>
          </div>
        </div>

        {/* Payslip Document Box */}
        <div
          id="payslip-print-area"
          className="app-card"
          style={{
            padding: '32px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          {/* Header of the slip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--primary-600)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                  P
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>PeoplePay360</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Confidential Salary Statement
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Payslip ID</div>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                {payslip.id}
              </div>
            </div>
          </div>

          {/* Employee & Period Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '18px 20px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  color: '#3730a3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                {(payslip.employee_name_snapshot || 'Employee').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Employee Name
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
                  {payslip.employee_name_snapshot || 'Employee'}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Employee Code / ID
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, fontFamily: 'monospace', color: '#334155', marginTop: '2px' }}>
                {payslip.employee_code_snapshot ? `#${payslip.employee_code_snapshot}` : payslip.employee_id}
              </div>
            </div>

            {payslip.department_name && (
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Department
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 650, color: '#0f172a', marginTop: '2px' }}>
                  🏢 {payslip.department_name}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Worked Days
              </div>
              <div style={{ fontSize: '14px', fontWeight: 750, color: '#0f172a', marginTop: '2px' }}>
                {payslip.worked_days ?? 'Standard Full Cycle'}
              </div>
            </div>
          </div>

          {/* Breakdown Lines Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              Itemized Earnings & Deductions
            </h4>

            <div className="app-table-wrapper">
              <table className="app-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Seq</th>
                    <th>Salary Rule</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payslip.lines && payslip.lines.length > 0 ? (
                    payslip.lines.map((l) => (
                      <tr key={l.id}>
                        <td style={{ color: '#94a3b8', fontSize: '12px' }}>{l.sequence}</td>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '13px' }}>{l.rule_name}</strong>
                          {l.calculation_description && (
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                              {l.calculation_description}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`app-badge ${
                              l.category === 'Deduction' ? 'app-badge-danger' : 'app-badge-info'
                            }`}
                          >
                            {l.category}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: l.category === 'Deduction' ? '#dc2626' : '#0f172a',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {l.category === 'Deduction' ? '-' : ''}
                          {formatCurrency(l.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                        No itemized lines recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Summary Block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px 20px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#475569' }}>
              <span>Total Gross Salary</span>
              <strong style={{ color: '#0f172a' }}>{formatCurrency(payslip.gross)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#dc2626' }}>
              <span>Total Deductions & Taxes</span>
              <strong>-{formatCurrency(payslip.deductions)}</strong>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '6px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
              <span style={{ color: '#0f172a' }}>Net Take-Home Pay</span>
              <span style={{ color: '#16a34a', fontSize: '18px' }}>{formatCurrency(payslip.net)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
