import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeOffTypes } from '../hooks/useTimeOff';
import { createRequest, getRequestsByEmployee } from '../services/time-off.service';
import { getContractLookups } from '@/features/contracts/services/contracts.service';
import { EmployeeLookup } from '@/features/contracts/types/contract.types';
import BalanceIndicator from '../components/BalanceIndicator';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { TimeOffRequest } from '../types';

const HR_ROLES = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  Draft:     { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: 'Draft' },
  Confirmed: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Confirmed' },
  Approved:  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Approved' },
  Refused:   { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'Refused' },
  Cancelled: { bg: '#fafafa', color: '#9ca3af', border: '#e5e7eb', label: 'Cancelled' },
};

export default function RequestFormPage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const isHR = HR_ROLES.includes(user?.role ?? '');
  const { types } = useTimeOffTypes();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [employees, setEmployees] = useState<EmployeeLookup[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeLookup | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(isHR ? '' : (user?.employeeId || ''));

  const [empRequests, setEmpRequests] = useState<TimeOffRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [form, setForm] = useState({ typeId: '', startDate: '', endDate: '', days: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isHR) {
      getContractLookups()
        .then((data) => setEmployees(data.employees || []))
        .catch(() => {});
    }
  }, [isHR]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const empId = isHR ? selectedEmployeeId : user?.employeeId;
    if (!empId) { setEmpRequests([]); return; }
    setLoadingRequests(true);
    getRequestsByEmployee(empId)
      .then((res) => setEmpRequests(res.data || []))
      .catch(() => setEmpRequests([]))
      .finally(() => setLoadingRequests(false));
  }, [selectedEmployeeId, isHR, user?.employeeId]);

  useEffect(() => {
    if (form.startDate && form.endDate && form.endDate >= form.startDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setForm((f) => ({ ...f, days: String(diff) }));
    }
  }, [form.startDate, form.endDate]);

  const handleSelectEmployee = (emp: EmployeeLookup) => {
    setSelectedEmp(emp);
    setSelectedEmployeeId(emp.id);
    setEmpSearch('');
    setShowDropdown(false);
  };

  const handleClearEmployee = () => {
    setSelectedEmp(null);
    setSelectedEmployeeId('');
    setEmpSearch('');
    setEmpRequests([]);
  };

  const filteredEmployees = employees.filter((e) => {
    if (!empSearch.trim()) return employees.slice(0, 12).includes(e);
    const q = empSearch.toLowerCase();
    const name = (e.name || `${e.firstName || ''} ${e.lastName || ''}`).toLowerCase();
    const num = (e.employeeNumber || '').toLowerCase();
    const dept = (e.departmentName || '').toLowerCase();
    return name.includes(q) || num.includes(q) || dept.includes(q);
  }).slice(0, 12);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.typeId || !form.startDate || !form.endDate || !form.days) {
      setError('Leave type, start date, end date, and days are required.');
      return;
    }
    const empId = isHR ? (selectedEmployeeId || user?.employeeId) : user?.employeeId;
    if (!empId) { setError('Please select an employee for this leave request.'); return; }
    setSaving(true);
    setError('');
    try {
      await createRequest({
        employeeId: empId,
        typeId: form.typeId,
        startDate: form.startDate,
        endDate: form.endDate,
        days: Number(form.days),
        reason: form.reason || undefined,
      });
      navigate('/time-off/requests');
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to submit request');
    } finally {
      setSaving(false);
    }
  };

  const pendingRequests = empRequests.filter((r) => ['Draft', 'Confirmed'].includes(r.status));
  const recentRequests = empRequests.filter((r) => !['Draft', 'Confirmed'].includes(r.status)).slice(0, 5);
  const effectiveEmpId = isHR ? selectedEmployeeId : user?.employeeId;

  const empDisplayName = selectedEmp
    ? (selectedEmp.name || `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim())
    : (user?.name || 'You');

  return (
    <div className="app-page">
      <div className="app-page-container" style={{ maxWidth: '900px' }}>
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button type="button" onClick={() => navigate('/time-off/requests')} className="app-btn app-btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                ← Back
              </button>
              <h1 className="app-page-title">Submit Leave Request</h1>
            </div>
            <p className="app-page-subtitle">
              {isHR ? 'Create a leave request on behalf of any employee' : 'Request time off for vacation, sick leave, or personal time'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: effectiveEmpId ? '1fr 330px' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* ──── LEFT: FORM ──── */}
          <div>
            {error && (
              <div style={{ padding: '14px 18px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13.5px', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Employee Search – HR Only */}
              {isHR && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <label className="app-label" style={{ fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔍</span> Find Employee *
                  </label>

                  {selectedEmp ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                          {empDisplayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#15803d' }}>{empDisplayName}</div>
                          <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                            {selectedEmp.employeeNumber && <span style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '1px 5px', borderRadius: '4px', marginRight: '6px' }}>#{selectedEmp.employeeNumber}</span>}
                            {selectedEmp.departmentName || 'General'} • {selectedEmp.jobTitle || 'Staff'}
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={handleClearEmployee} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626', cursor: 'pointer', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
                        Change ✕
                      </button>
                    </div>
                  ) : (
                    <div ref={dropdownRef} style={{ position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                          type="text"
                          className="app-input"
                          placeholder="Type name, badge number or department..."
                          value={empSearch}
                          style={{ paddingLeft: '34px' }}
                          onChange={(e) => { setEmpSearch(e.target.value); setShowDropdown(true); }}
                          onFocus={() => setShowDropdown(true)}
                        />
                      </div>
                      {showDropdown && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18)', maxHeight: '260px', overflowY: 'auto', marginTop: '4px' }}>
                          {filteredEmployees.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No employees found</div>
                          ) : filteredEmployees.map((e) => {
                            const name = e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim();
                            return (
                              <div key={e.id} onMouseDown={() => handleSelectEmployee(e)}
                                style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                onMouseEnter={(ev) => (ev.currentTarget.style.background = '#f0f9ff')}
                                onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                                    {name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{name}</div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>{e.departmentName || 'General'} • {e.jobTitle || 'Staff'}</div>
                                  </div>
                                </div>
                                {e.employeeNumber && (
                                  <span style={{ fontSize: '11px', fontFamily: 'monospace', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    #{e.employeeNumber}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Leave Balance */}
              {effectiveEmpId && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    {isHR ? `${empDisplayName}'s Leave Balances` : 'Your Remaining Leave Balances'}
                  </div>
                  <BalanceIndicator employeeId={effectiveEmpId} />
                </div>
              )}

              {/* Leave Type */}
              <div className="app-form-group">
                <label className="app-label">Leave Type *</label>
                <select className="app-select" value={form.typeId} onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value }))} required>
                  <option value="">Select leave category...</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.unit}) {t.isPaid ? '— Paid' : '— Unpaid'}</option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="app-form-group">
                  <label className="app-label">Start Date *</label>
                  <input type="date" className="app-input" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
                </div>
                <div className="app-form-group">
                  <label className="app-label">End Date *</label>
                  <input type="date" className="app-input" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} required />
                </div>
              </div>

              {/* Duration */}
              <div className="app-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="app-label" style={{ margin: 0 }}>Duration (Days) *</label>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Auto-calculated from dates</span>
                </div>
                <input type="number" className="app-input" min="0.5" step="0.5" value={form.days} onChange={(e) => setForm((f) => ({ ...f, days: e.target.value }))} required />
              </div>

              {/* Reason */}
              <div className="app-form-group">
                <label className="app-label">Reason or Notes</label>
                <textarea className="app-input" rows={3} placeholder="Describe the context or reason for this leave..." value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button type="button" className="app-btn app-btn-secondary" onClick={() => navigate('/time-off/requests')} disabled={saving}>Cancel</button>
                <button type="submit" className="app-btn app-btn-primary" disabled={saving || (isHR && !selectedEmployeeId)}>
                  {saving ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>

          {/* ──── RIGHT: EMPLOYEE LEAVE PANEL ──── */}
          {effectiveEmpId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Pending */}
              <div className="app-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>⏳ Pending Requests</h4>
                  {!loadingRequests && (
                    <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: pendingRequests.length > 0 ? '#fef3c7' : '#f0fdf4', color: pendingRequests.length > 0 ? '#92400e' : '#166534', border: pendingRequests.length > 0 ? '1px solid #fde68a' : '1px solid #bbf7d0' }}>
                      {pendingRequests.length} pending
                    </span>
                  )}
                </div>

                {loadingRequests ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                    <div style={{ marginBottom: '6px', fontSize: '18px' }}>⏳</div>Fetching leave history...
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>✅</div>No pending requests
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingRequests.map((r) => {
                      const s = STATUS_STYLES[r.status] || STATUS_STYLES['Draft'];
                      return (
                        <div key={r.id} style={{ padding: '10px 12px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{r.typeName || 'Leave'}</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                {r.startDate} → {r.endDate}
                                <span style={{ marginLeft: '6px', fontWeight: 600, color: '#475569' }}>({r.days}d)</span>
                              </div>
                              {r.reason && <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '3px', fontStyle: 'italic' }}>"{r.reason}"</div>}
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', flexShrink: 0, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent History */}
              {!loadingRequests && recentRequests.length > 0 && (
                <div className="app-card" style={{ padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>📋 Recent History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {recentRequests.map((r) => {
                      const s = STATUS_STYLES[r.status] || STATUS_STYLES['Draft'];
                      return (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '7px', background: '#f8fafc', border: '1px solid #f1f5f9', gap: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#334155' }}>{r.typeName}</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{r.startDate} • {r.days}d</div>
                          </div>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '8px', flexShrink: 0, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary */}
              {!loadingRequests && empRequests.length > 0 && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '10px' }}>All-Time Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'Total', value: empRequests.length, color: '#e2e8f0' },
                      { label: 'Approved', value: empRequests.filter(r => r.status === 'Approved').length, color: '#86efac' },
                      { label: 'Pending', value: pendingRequests.length, color: '#fde68a' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
