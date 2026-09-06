import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getContract, createContract, updateContract, getContractLookups } from '../services/contracts.service';
import { getEmployee } from '@/features/employees/services/employees.service';
import { ContractFormValues, ContractStatus, ContractLookups } from '../types/contract.types';
import { Employee } from '@/features/employees/types/employee.types';
import { toDateInputValue } from '@/shared/utils/date-only';

const STATUSES: ContractStatus[] = ['New', 'Running', 'Expired', 'Cancelled'];

const EMPTY: ContractFormValues = {
  employeeId: '',
  contractRef: '',
  status: 'New',
  department: '',
  jobPosition: '',
  wage: 0,
  startDate: '',
  endDate: '',
  scheduleId: '',
  structureId: '',
  notes: '',
};

export default function ContractFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const urlEmployeeId = searchParams.get('employeeId');

  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');

  const [form, setForm] = useState<ContractFormValues>(EMPTY);
  const [autoFilledEmployee, setAutoFilledEmployee] = useState<Employee | null>(null);
  const [lookups, setLookups] = useState<ContractLookups | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Lookups (Employees, Departments, Schedules, Salary Structures, Job Positions)
  useEffect(() => {
    getContractLookups()
      .then((data) => setLookups(data))
      .catch(() => {})
      .finally(() => setLookupsLoading(false));
  }, []);

  // If URL has ?employeeId=..., auto-fetch and pre-populate all details
  useEffect(() => {
    if (isEdit || !urlEmployeeId) return;
    getEmployee(urlEmployeeId)
      .then((emp) => {
        setAutoFilledEmployee(emp);
        setForm((prev) => ({
          ...prev,
          employeeId: emp.id,
          department: prev.department || emp.departmentName || '',
          jobPosition: prev.jobPosition || emp.jobPositionName || emp.jobTitle || '',
          scheduleId: prev.scheduleId || emp.scheduleId || '',
          wage: prev.wage || emp.currentContract?.wage || 0,
          structureId: prev.structureId || emp.currentContract?.structureId || '',
          startDate: prev.startDate || (emp.hireDate ? toDateInputValue(emp.hireDate) : new Date().toISOString().slice(0, 10)),
          contractRef:
            prev.contractRef ||
            `CTR-${emp.employeeNumber ? emp.employeeNumber.replace('EMP-', '') : emp.firstName.toUpperCase().slice(0, 3)}-${new Date().getFullYear()}`,
        }));
      })
      .catch(() => {});
  }, [urlEmployeeId, isEdit]);

  // Load Existing Contract if in Edit Mode
  useEffect(() => {
    if (!isEdit || !id) return;
    getContract(id)
      .then((c) =>
        setForm({
          employeeId: c.employeeId,
          contractRef: c.contractRef ?? '',
          status: c.status,
          department: c.department ?? '',
          jobPosition: c.jobPosition ?? '',
          wage: c.wage,
          startDate: toDateInputValue(c.startDate),
          endDate: toDateInputValue(c.endDate),
          scheduleId: c.scheduleId ?? '',
          structureId: c.structureId ?? '',
          notes: c.notes ?? '',
        })
      )
      .catch(() => setError('Failed to load contract details'));
  }, [id, isEdit]);

  function set(field: keyof ContractFormValues, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Handle Employee Selection with Auto-population
  function handleEmployeeSelect(selectedEmpId: string) {
    const selectedEmp = lookups?.employees.find((e) => e.id === selectedEmpId);
    setForm((prev) => {
      const patch: Partial<ContractFormValues> = { employeeId: selectedEmpId };
      if (selectedEmp) {
        if (!prev.department && selectedEmp.departmentName) {
          patch.department = selectedEmp.departmentName;
        }
        if (!prev.jobPosition && selectedEmp.jobTitle) {
          patch.jobPosition = selectedEmp.jobTitle;
        }
        if (!prev.scheduleId && selectedEmp.scheduleId) {
          patch.scheduleId = selectedEmp.scheduleId;
        }
        if (!prev.contractRef) {
          const empNum = selectedEmp.employeeNumber ? selectedEmp.employeeNumber.replace('EMP-', '') : 'CTR';
          patch.contractRef = `CTR-${empNum}-${new Date().getFullYear()}`;
        }
      }
      return { ...prev, ...patch };
    });
  }

  // Selected Employee Info Helper
  const selectedEmployee =
    (autoFilledEmployee && autoFilledEmployee.id === form.employeeId
      ? {
          id: autoFilledEmployee.id,
          name: `${autoFilledEmployee.firstName} ${autoFilledEmployee.lastName}`,
          employeeNumber: autoFilledEmployee.employeeNumber,
          workEmail: autoFilledEmployee.workEmail,
          departmentName: autoFilledEmployee.departmentName,
          jobTitle: autoFilledEmployee.jobPositionName || autoFilledEmployee.jobTitle,
        }
      : undefined) || lookups?.employees.find((e) => e.id === form.employeeId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, endDate: form.endDate || null, wage: parseFloat(form.wage.toString()) };
      if (isEdit && id) {
        await updateContract(id, payload);
      } else {
        await createContract(payload);
      }
      navigate('/contracts');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Failed to save contract'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
              }}
            >
              ← Back to Contracts
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="app-page-title">
                {isEdit ? `Edit Contract: ${form.contractRef || id}` : 'New Employment Contract'}
              </h1>
              <span className="app-badge app-badge-info">{isEdit ? 'Existing Contract' : 'New Contract'}</span>
            </div>
            <p className="app-page-subtitle">
              Configure baseline compensation, validity dates, department assignment, and payroll structure
            </p>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={() => setShowAgreementModal(true)}
              className="app-btn app-btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Preview & Print Official Employment Agreement"
            >
              <span>🖨️</span>
              <span>Print Agreement</span>
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13.5px',
              fontWeight: 600,
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          {/* Section 1: Role & Identity */}
          <div className="app-form-section">
            <div className="app-form-section-header">
              <div>
                <h4 className="app-form-section-title">
                  <span style={{ fontSize: '18px' }}>📋</span> 1. Role & Employment Assignment
                </h4>
                <p className="app-form-section-subtitle">
                  Associate contract with employee, reference codes, position, and department
                </p>
              </div>
            </div>

            <div className="app-form-grid">
              {/* Employee Selection Dropdown */}
              <div className="app-form-group app-form-group-full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="app-label" style={{ margin: 0 }}>
                    Associate Employee <span className="app-label-required">*</span>
                  </label>
                  {autoFilledEmployee && (
                    <span
                      className="app-badge app-badge-success"
                      style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 650 }}
                    >
                      <span>✓</span> Auto-filled for {autoFilledEmployee.firstName} {autoFilledEmployee.lastName}
                    </span>
                  )}
                </div>

                {lookupsLoading && !autoFilledEmployee ? (
                  <div style={{ padding: '10px 14px', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '8px' }}>
                    Loading employee roster...
                  </div>
                ) : (
                  <select
                    className="app-select"
                    value={form.employeeId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    required
                    disabled={isEdit}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Select an Employee from Roster --</option>
                    {/* Ensure autoFilledEmployee is at the top if present */}
                    {autoFilledEmployee && !lookups?.employees?.some((e) => e.id === autoFilledEmployee.id) && (
                      <option value={autoFilledEmployee.id}>
                        {autoFilledEmployee.firstName} {autoFilledEmployee.lastName}{' '}
                        {autoFilledEmployee.employeeNumber ? `(#${autoFilledEmployee.employeeNumber})` : ''} —{' '}
                        {autoFilledEmployee.departmentName || 'General'} ·{' '}
                        {autoFilledEmployee.jobPositionName || autoFilledEmployee.jobTitle || 'Staff'}
                      </option>
                    )}
                    {lookups?.employees?.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.employeeNumber ? `(#${emp.employeeNumber})` : ''} — {emp.departmentName || 'General'} · {emp.jobTitle || 'Staff'}
                      </option>
                    ))}
                  </select>
                )}

                {/* Selected Employee Summary Card */}
                {selectedEmployee && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '10px 14px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12.5px',
                      color: '#166534',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>👤</span>
                    <div>
                      <strong>{selectedEmployee.name}</strong>
                      {selectedEmployee.employeeNumber && <span style={{ marginLeft: '6px', color: '#15803d' }}>#{selectedEmployee.employeeNumber}</span>}
                      {selectedEmployee.workEmail && <span style={{ marginLeft: '10px', color: '#4b5563' }}>• {selectedEmployee.workEmail}</span>}
                      {selectedEmployee.departmentName && <span style={{ marginLeft: '10px', color: '#4b5563' }}>• Dept: {selectedEmployee.departmentName}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Contract Reference Code */}
              <div className="app-form-group">
                <label className="app-label">Contract Reference Code</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className="app-input"
                    value={form.contractRef}
                    onChange={(e) => set('contractRef', e.target.value)}
                    placeholder="e.g. CTR-2026-001"
                    style={{ flex: 1 }}
                  />
                  {!form.contractRef && form.employeeId && (
                    <button
                      type="button"
                      onClick={() => {
                        const empNum = selectedEmployee?.employeeNumber ? selectedEmployee.employeeNumber.replace('EMP-', '') : 'EMP';
                        set('contractRef', `CTR-${empNum}-${new Date().getFullYear()}`);
                      }}
                      className="app-btn app-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>

              {/* Contract Status */}
              <div className="app-form-group">
                <label className="app-label">
                  Contract Status <span className="app-label-required">*</span>
                </label>
                <select
                  className="app-select"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as ContractStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Dropdown */}
              <div className="app-form-group">
                <label className="app-label">Assigned Department</label>
                <select
                  className="app-select"
                  value={form.department ?? ''}
                  onChange={(e) => set('department', e.target.value)}
                >
                  <option value="">-- Select Department --</option>
                  {lookups?.departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Position Dropdown / Input */}
              <div className="app-form-group">
                <label className="app-label">Job Position</label>
                <input
                  className="app-input"
                  list="job-positions-list"
                  value={form.jobPosition ?? ''}
                  onChange={(e) => set('jobPosition', e.target.value)}
                  placeholder="Select or enter job position..."
                />
                <datalist id="job-positions-list">
                  {lookups?.jobPositions.map((jp, i) => (
                    <option key={i} value={jp.title}>
                      {jp.departmentName ? `${jp.title} (${jp.departmentName})` : jp.title}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Section 2: Compensation & Period */}
          <div className="app-form-section">
            <div className="app-form-section-header">
              <div>
                <h4 className="app-form-section-title">
                  <span style={{ fontSize: '18px' }}>💰</span> 2. Compensation & Validity Period
                </h4>
                <p className="app-form-section-subtitle">
                  Define baseline wage, commencement date, and expiration / renewal milestones
                </p>
              </div>
            </div>

            <div className="app-form-grid">
              <div className="app-form-group">
                <label className="app-label">
                  Monthly Gross Wage (INR ₹) <span className="app-label-required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontWeight: 700,
                      pointerEvents: 'none',
                    }}
                  >
                    ₹
                  </span>
                  <input
                    className="app-input"
                    type="float"
                    min={0}
                    value={form.wage}
                    onChange={(e) => set('wage', e.target.value)}
                    required
                    style={{ paddingLeft: '28px', fontWeight: 700, fontSize: '14.5px' }}
                  />
                </div>
                {Number(form.wage) > 0 && (
                  <span style={{ fontSize: '12px', color: '#16a34a', marginTop: '3px', fontWeight: 650 }}>
                    ₹ {Number(form.wage).toLocaleString('en-IN')} / month (Annual: ₹ {(Number(form.wage) * 12).toLocaleString('en-IN')})
                  </span>
                )}
              </div>

              <div className="app-form-group">
                <label className="app-label">
                  Contract Start Date <span className="app-label-required">*</span>
                </label>
                <input
                  className="app-input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                  required
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Contract End Date</label>
                <input
                  className="app-input"
                  type="date"
                  value={form.endDate ?? ''}
                  onChange={(e) => set('endDate', e.target.value)}
                />
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Leave blank for open-ended (permanent) employment.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Schedule & Structure */}
          <div className="app-form-section">
            <div className="app-form-section-header">
              <div>
                <h4 className="app-form-section-title">
                  <span style={{ fontSize: '18px' }}>⚙️</span> 3. Working Schedule & Salary Structure
                </h4>
                <p className="app-form-section-subtitle">
                  Link contractual hours policy and statutory salary computation matrix
                </p>
              </div>
            </div>

            <div className="app-form-grid">
              {/* Working Schedule Dropdown */}
              <div className="app-form-group">
                <label className="app-label">Working Schedule Policy</label>
                <select
                  className="app-select"
                  value={form.scheduleId ?? ''}
                  onChange={(e) => set('scheduleId', e.target.value)}
                >
                  <option value="">-- Select Working Schedule --</option>
                  {lookups?.schedules.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.weeklyHours}h/week) {sch.company ? `— ${sch.company}` : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Defines daily working hours, grace periods, and overtime calculations.
                </span>
              </div>

              {/* Salary Structure Dropdown */}
              <div className="app-form-group">
                <label className="app-label">Salary Computation Structure</label>
                <select
                  className="app-select"
                  value={form.structureId ?? ''}
                  onChange={(e) => set('structureId', e.target.value)}
                >
                  <option value="">-- Select Salary Structure --</option>
                  {lookups?.structures.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.isActive ? '' : '(Inactive)'}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  Determines statutory allowances, deductions (PF/ESI/TDS), and net pay formulas.
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div className="app-form-section">
            <div className="app-form-section-header">
              <div>
                <h4 className="app-form-section-title">
                  <span style={{ fontSize: '18px' }}>📝</span> 4. Provisions & Contract Notes
                </h4>
                <p className="app-form-section-subtitle">
                  Special contractual clauses, probation requirements, or custom provisions
                </p>
              </div>
            </div>

            <div className="app-form-group app-form-group-full">
              <textarea
                className="app-textarea"
                rows={4}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Specific clauses, probation terms, annual bonus details, or special provisions..."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              padding: '20px 24px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--app-shadow-card)',
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="app-btn app-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="app-btn app-btn-primary"
              style={{ minWidth: '160px', padding: '11px 24px', fontSize: '14px' }}
            >
              {loading ? 'Saving Contract...' : isEdit ? 'Save Changes' : 'Create Contract'}
            </button>
          </div>
        </form>

        {/* Contract Agreement Document Modal */}
        {showAgreementModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <div
              className="app-card"
              style={{
                width: '100%',
                maxWidth: '780px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Top Bar (Screen Only) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📑</span>
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                    Official Employment Agreement Document
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="app-btn app-btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12.5px' }}
                  >
                    🖨️ Print Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAgreementModal(false)}
                    className="app-btn app-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12.5px' }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div
                style={{
                  padding: '36px 44px',
                  overflowY: 'auto',
                  color: '#1e293b',
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  fontFamily: 'serif, system-ui, sans-serif',
                }}
              >
                {/* Header Letterhead */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a' }}>
                    PeoplePay360 Global Solutions
                  </h2>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Corporate Human Resources & Employment Management Authority
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#4f46e5', marginTop: '6px', textTransform: 'uppercase' }}>
                    Employment Contract Agreement & Terms of Service
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                    Ref: <strong>{form.contractRef || 'CTR-2026-OFFICIAL'}</strong> · Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {/* Agreement Preamble */}
                <p style={{ margin: '0 0 16px' }}>
                  This Employment Agreement (the <strong>"Agreement"</strong>) is entered into between <strong>PeoplePay360 Inc.</strong> (the <em>"Employer"</em>) and the undersigned employee (the <em>"Employee"</em>) upon the terms and conditions outlined below.
                </p>

                {/* Details Table */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, width: '35%', color: '#475569' }}>Employee Name</td>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#0f172a' }}>
                          {selectedEmployee?.name || 'Designated Employee'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#475569' }}>Employee Number / ID</td>
                        <td style={{ padding: '8px 14px', color: '#0f172a' }}>
                          {selectedEmployee?.employeeNumber || form.employeeId || '—'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#475569' }}>Job Position / Title</td>
                        <td style={{ padding: '8px 14px', color: '#0f172a' }}>{form.jobPosition || 'Staff Member'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#475569' }}>Department</td>
                        <td style={{ padding: '8px 14px', color: '#0f172a' }}>{form.department || 'General Operations'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#475569' }}>Monthly Gross Remuneration</td>
                        <td style={{ padding: '8px 14px', color: '#16a34a', fontWeight: 800 }}>
                          ₹{Number(form.wage || 0).toLocaleString('en-IN')} / month
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#475569' }}>Working Schedule Policy</td>
                        <td style={{ padding: '8px 14px', color: '#0f172a' }}>
                          {lookups?.schedules.find((s) => s.id === form.scheduleId)?.name || 'Corporate Standard (40h/week)'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#475569' }}>Salary Computation Matrix</td>
                        <td style={{ padding: '8px 14px', color: '#0f172a' }}>
                          {lookups?.structures.find((s) => s.id === form.structureId)?.name || 'Standard Statutory Salary Structure'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#475569' }}>Effective Commencement Date</td>
                        <td style={{ padding: '8px 14px', color: '#0f172a' }}>{form.startDate || 'Immediate'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#475569' }}>Contract Expiry / Renewal</td>
                        <td style={{ padding: '8px 14px', color: '#0f172a' }}>
                          {form.endDate ? form.endDate : 'Permanent / Open-Ended Employment'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Special Clauses */}
                {form.notes && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                      Special Provisions & Contract Notes:
                    </div>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px', fontStyle: 'italic' }}>
                      {form.notes}
                    </div>
                  </div>
                )}

                {/* Standard Legal Text */}
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 24px' }}>
                  The Employee agrees to faithfully perform the duties assigned under the company guidelines, policies, and statutory compliance regulations. All confidential business information remains property of the Employer.
                </p>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #cbd5e1' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ borderBottom: '1px solid #0f172a', minHeight: '40px', marginBottom: '6px' }}></div>
                    <strong style={{ display: 'block', fontSize: '12.5px', color: '#0f172a' }}>For PeoplePay360 Inc.</strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Authorized HR Officer Signatory</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ borderBottom: '1px solid #0f172a', minHeight: '40px', marginBottom: '6px' }}></div>
                    <strong style={{ display: 'block', fontSize: '12.5px', color: '#0f172a' }}>
                      {selectedEmployee?.name || 'Employee Acceptance'}
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>Employee Signature & Date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
