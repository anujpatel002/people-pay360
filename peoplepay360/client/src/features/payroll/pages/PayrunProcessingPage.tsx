import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { action, getPayrun, deletePayrun, resolveWarning } from '../services/payroll.service';
import { Payrun, PayrunStatus, PayrollWarning } from '../types/payroll.types';

const PIPELINE_STAGES: PayrunStatus[] = ['Draft', 'Computed', 'Validated', 'Paid'];

export default function PayrunProcessingPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState<Payrun>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [warningToResolve, setWarningToResolve] = useState<PayrollWarning | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getPayrun(id)
      .then((data) => {
        setPayrun(data);
        setError(null);
      })
      .catch((err) => {
        setError(err?.response?.data?.error ?? 'Failed to load payrun details');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [id]);

  const go = async (act: 'compute' | 'recompute' | 'validate' | 'mark-paid' | 'send') => {
    setActionLoading(true);
    setError(null);
    try {
      await action(id, act);
      void load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? `Action "${act}" failed`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deletePayrun(id);
      navigate('/payroll');
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to delete payrun');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleResolveWarning = async () => {
    if (!warningToResolve) return;
    setResolving(true);
    setError(null);
    try {
      await resolveWarning(warningToResolve.id, resolutionNote);
      setWarningToResolve(null);
      setResolutionNote('');
      void load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to resolve warning');
    } finally {
      setResolving(false);
    }
  };

  const handleExportBankSheet = () => {
    if (!payrun?.payslips?.length) {
      alert('No payslip records available to export.');
      return;
    }
    const headers = [
      'Employee Number',
      'Employee Name',
      'Department',
      'Pay Period Start',
      'Pay Period End',
      'Gross Earnings (INR)',
      'Total Deductions (INR)',
      'Net Payable (INR)',
      'Payment Status',
    ];

    const rows = payrun.payslips.map((p) => [
      `"${p.employee_number || p.employee_id || ''}"`,
      `"${p.employee_name || 'Employee'}"`,
      `"${p.department_name || ''}"`,
      `"${payrun.period_start}"`,
      `"${payrun.period_end}"`,
      Number(p.gross_pay || 0).toFixed(2),
      Number(p.total_deductions || 0).toFixed(2),
      Number(p.net_pay || 0).toFixed(2),
      `"${p.status || payrun.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bank_disbursement_${payrun.name.replace(/\s+/g, '_')}_${payrun.period_start}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading && !payrun) {
    return (
      <div className="app-page">
        <div className="app-page-container" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading payrun processing details...
        </div>
      </div>
    );
  }

  if (!payrun) {
    return (
      <div className="app-page">
        <div className="app-page-container" style={{ textAlign: 'center', padding: '60px 0', color: '#dc2626' }}>
          Payrun not found
        </div>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.indexOf(payrun.status);

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => navigate('/payroll')}
                className="app-btn app-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ← Back to Payruns
              </button>
              <h1 className="app-page-title">{payrun.name}</h1>
            </div>
            <p className="app-page-subtitle">
              Period: <strong>{payrun.period_start}</strong> to <strong>{payrun.period_end}</strong>
            </p>
          </div>

          {/* Action Bar based on Status */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {payrun.status === 'Draft' && (
              <button
                type="button"
                onClick={() => go('compute')}
                disabled={actionLoading || deleting}
                className="app-btn app-btn-primary"
              >
                {actionLoading ? 'Computing...' : '⚡ Compute Payroll'}
              </button>
            )}

            {payrun.status === 'Computed' && (
              <>
                <button
                  type="button"
                  onClick={() => go('recompute')}
                  disabled={actionLoading || deleting}
                  className="app-btn app-btn-secondary"
                >
                  🔄 Recompute
                </button>
                <button
                  type="button"
                  onClick={() => go('validate')}
                  disabled={actionLoading || deleting}
                  className="app-btn app-btn-primary"
                >
                  ✓ Validate & Lock Payrun
                </button>
              </>
            )}

            {payrun.status === 'Validated' && (
              <button
                type="button"
                onClick={() => go('mark-paid')}
                disabled={actionLoading || deleting}
                className="app-btn app-btn-success"
              >
                💰 Mark as Paid & Disbursed
              </button>
            )}

            {payrun.status === 'Paid' && (
              <button
                type="button"
                onClick={() => go('send')}
                disabled={actionLoading || deleting}
                className="app-btn app-btn-primary"
              >
                ✉️ Send Payslips to Employees
              </button>
            )}

            {/* Export Bank Disbursement Sheet */}
            {payrun.payslips && payrun.payslips.length > 0 && (
              <button
                type="button"
                onClick={handleExportBankSheet}
                disabled={actionLoading || deleting}
                className="app-btn app-btn-secondary"
                title="Export bank salary transfer register to CSV"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export Bank Sheet (CSV)</span>
              </button>
            )}

            {/* Delete Payrun Button */}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={actionLoading || deleting}
              className="app-btn app-btn-subtle"
              style={{ color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2' }}
              title="Delete this payrun batch"
            >
              🗑️ Delete Payrun
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              className="app-card"
              style={{
                maxWidth: '480px',
                width: '100%',
                padding: '28px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Delete Payroll Run
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
                Are you sure you want to delete <strong>{payrun.name}</strong> ({payrun.period_start} to {payrun.period_end})? All associated payslips, calculation traces, and inputs will be removed.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="app-btn app-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="app-btn"
                  style={{ background: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 700 }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete Payrun'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warning Resolution Modal */}
        {warningToResolve && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              className="app-card"
              style={{
                maxWidth: '520px',
                width: '100%',
                padding: '28px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  ⚙️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Resolve Payroll Warning
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Override or acknowledge validation exception
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  [{warningToResolve.code}] {warningToResolve.message}
                </div>
                {warningToResolve.employee_name && (
                  <div style={{ color: '#475569', fontSize: '12.5px' }}>
                    👤 Employee: <strong>{warningToResolve.employee_name}</strong> {warningToResolve.employee_number ? `(#${warningToResolve.employee_number})` : ''}
                  </div>
                )}
              </div>

              <div className="app-form-group" style={{ marginBottom: '20px' }}>
                <label className="app-label">
                  Audit & Resolution Reason <span className="app-label-required">*</span>
                </label>
                <textarea
                  className="app-textarea"
                  rows={3}
                  placeholder="e.g. Overlapping payrun verified as prorated mid-cycle adjustment; approved by HR."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  required
                  style={{ resize: 'vertical', minHeight: '70px' }}
                />
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  This reason will be recorded in the payroll audit trail.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setWarningToResolve(null)}
                  disabled={resolving}
                  className="app-btn app-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResolveWarning}
                  disabled={resolving || !resolutionNote.trim()}
                  className="app-btn app-btn-primary"
                >
                  {resolving ? 'Resolving...' : '✓ Acknowledge & Resolve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Stage Bar */}
        <div
          className="app-card"
          style={{
            padding: '16px 24px',
            marginBottom: '24px',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            {PIPELINE_STAGES.map((st, idx) => {
              const isPassed = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--primary-600)' : isPassed ? '#16a34a' : '#e2e8f0',
                      color: isCurrent || isPassed ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: isCurrent ? 800 : 500,
                      color: isCurrent ? '#0f172a' : isPassed ? '#16a34a' : '#94a3b8',
                    }}
                  >
                    {st}
                  </span>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <span style={{ color: '#cbd5e1', marginLeft: '8px' }}>→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Key Metrics Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div className="app-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Payrun Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              <span className="app-badge app-badge-info">{payrun.status}</span>
            </div>
          </div>

          <div className="app-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Employees Processed
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {payrun.payslips?.length ?? payrun.employee_count ?? 0}
            </div>
          </div>

          <div className="app-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Gross Payroll
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
              {formatCurrency(payrun.total_gross)}
            </div>
          </div>

          <div className="app-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Net Payable
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
              {formatCurrency(payrun.total_net)}
            </div>
          </div>

          <div className="app-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Warnings Detected
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: (payrun.warnings?.length ?? 0) > 0 ? '#b45309' : '#16a34a', marginTop: '4px' }}>
              {payrun.warnings?.length ?? payrun.warning_count ?? 0}
            </div>
          </div>
        </div>

        {/* Warnings Section */}
        {payrun.warnings && payrun.warnings.length > 0 && (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚠️</span> Payroll Computation Warnings ({payrun.warnings.length})
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#b45309' }}>
                  {payrun.warnings.some((w) => w.blocking && w.status === 'OPEN')
                    ? '🔴 Blocking warnings prevent this payrun from being Validated or Paid until resolved or overridden.'
                    : 'Advisory warnings for HR review. These do not block validation.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {payrun.warnings.map((w) => {
                const isResolved = w.status === 'RESOLVED';
                return (
                  <div
                    key={w.id}
                    style={{
                      background: isResolved ? '#f0fdf4' : '#ffffff',
                      border: isResolved ? '1px solid #bbf7d0' : w.blocking ? '1px solid #fca5a5' : '1px solid #fef08a',
                      borderRadius: '10px',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {isResolved ? (
                          <span className="app-badge app-badge-success" style={{ fontSize: '10.5px' }}>
                            ✓ RESOLVED
                          </span>
                        ) : w.blocking ? (
                          <span
                            style={{
                              background: '#dc2626',
                              color: '#ffffff',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                            }}
                          >
                            BLOCKING
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              border: '1px solid #fde68a',
                            }}
                          >
                            ADVISORY
                          </span>
                        )}
                        <strong style={{ fontFamily: 'monospace', fontSize: '13px', color: '#0f172a' }}>
                          [{w.code}]
                        </strong>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                          {w.message}
                        </span>
                      </div>

                      {/* Employee details associated with this warning */}
                      <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
                        {w.employee_name && (
                          <span style={{ fontWeight: 650, color: '#0f172a' }}>
                            👤 Employee: {w.employee_name} {w.employee_number ? `(#${w.employee_number})` : ''}
                          </span>
                        )}
                        {w.department_name && <span>• Dept: {w.department_name}</span>}
                        {isResolved && w.resolution_note && (
                          <span style={{ color: '#16a34a', fontStyle: 'italic' }}>
                            • Resolution: "{w.resolution_note}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {w.payslip_id && (
                        <button
                          type="button"
                          onClick={() => navigate(`/payslips/${w.payslip_id}`)}
                          className="app-btn app-btn-subtle"
                          style={{ padding: '4px 10px', fontSize: '12px', color: '#4338ca' }}
                        >
                          View Payslip →
                        </button>
                      )}
                      {!isResolved && (
                        <button
                          type="button"
                          onClick={() => {
                            setWarningToResolve(w);
                            setResolutionNote('');
                          }}
                          className="app-btn app-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}
                        >
                          Resolve / Override
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payslips Table */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Employee Payslips ({payrun.payslips?.length ?? 0})
            </h3>
          </div>

          {!payrun.payslips || payrun.payslips.length === 0 ? (
            <div className="app-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
              <p style={{ margin: 0, fontSize: '13.5px' }}>
                {payrun.status === 'Draft'
                  ? 'Click "Compute Payroll" above to generate employee payslips.'
                  : 'No payslips generated for this run.'}
              </p>
            </div>
          ) : (
            <div className="app-table-wrapper">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th style={{ textAlign: 'center' }}>Worked Days</th>
                    <th style={{ textAlign: 'right' }}>Gross Wage</th>
                    <th style={{ textAlign: 'right' }}>Deductions</th>
                    <th style={{ textAlign: 'right' }}>Net Payable</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrun.payslips.map((s) => {
                    const empName = s.employee_name_snapshot || 'Employee';
                    const empCode = s.employee_code_snapshot;
                    const initial = empName.charAt(0).toUpperCase() || 'E';

                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#e0e7ff',
                                color: '#3730a3',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '12px',
                                flexShrink: 0,
                              }}
                            >
                              {initial}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>
                                {empName}
                              </strong>
                              {empCode && (
                                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                                  #{empCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', color: '#475569' }}>
                          {s.worked_days ?? '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                          {formatCurrency(s.gross)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                        {formatCurrency(s.deductions)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(s.net)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/payslips/${s.id}`)}
                          className="app-btn app-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          View Payslip →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
