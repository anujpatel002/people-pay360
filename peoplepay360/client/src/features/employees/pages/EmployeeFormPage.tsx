import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmployee } from '../hooks/useEmployee';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { EmployeeFormValues } from '../types/employee.types';
import * as service from '../services/employees.service';
import EmployeeAvatar from '../components/EmployeeAvatar';
import EmployeeStatusBadge from '../components/EmployeeStatusBadge';
import SmartButtons from '../components/SmartButtons';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeContractSummary from '../components/EmployeeContractSummary';
import EmployeeArchiveDialog from '../components/EmployeeArchiveDialog';
import EmployeeRestoreDialog from '../components/EmployeeRestoreDialog';
import EmployeeHistoryTab from '../components/EmployeeHistoryTab';
import { toDateInputValue } from '@/shared/utils/date-only';

const PAYROLL_ROLES = new Set(['HR Payroll User', 'HR Payroll Manager', 'Admin']);
const HR_ROLES = new Set(['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin']);

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const { employee, smartCounts, loading, error } = useEmployee(isNew ? undefined : id);
  const [editing, setEditing] = useState(isNew);
  const [showArchive, setShowArchive] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  const canEdit = HR_ROLES.has(user?.role ?? '');
  const canViewPayroll = PAYROLL_ROLES.has(user?.role ?? '');

  async function handleSubmit(values: EmployeeFormValues) {
    if (isNew) {
      const emp = await service.createEmployee(values);
      navigate(`/employees/${emp.id}`, { replace: true });
    } else {
      await service.updateEmployee(id!, values);
      setEditing(false);
      window.location.reload();
    }
  }

  async function handleArchive() {
    setActionLoading(true);
    try {
      await service.archiveEmployee(id!);
      navigate('/employees');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRestore() {
    setActionLoading(true);
    try {
      await service.restoreEmployee(id!);
      window.location.reload();
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="app-page">
        <div className="app-page-container">
          <div className="app-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading employee profile...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page">
        <div className="app-page-container">
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        </div>
      </div>
    );
  }

  const initialValues: Partial<EmployeeFormValues> = employee
    ? {
        firstName: employee.firstName,
        lastName: employee.lastName,
        workEmail: employee.workEmail,
        phone: employee.phone,
        privateAddress: employee.privateAddress,
        emergencyContact: employee.emergencyContact,
        emergencyContactPhone: employee.emergencyContactPhone,
        jobTitle: employee.jobTitle,
        jobPositionId: employee.jobPositionId,
        departmentId: employee.departmentId,
        managerId: employee.managerId,
        employmentType: employee.employmentType,
        companyId: employee.companyId,
        location: employee.location,
        scheduleId: employee.scheduleId,
        hireDate: toDateInputValue(employee.hireDate),
        bankAccount: employee.bankAccount,
        iban: employee.iban,
        swift: employee.swift,
      }
    : { employmentType: 'full_time' };

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Page Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <button
              type="button"
              onClick={() => navigate('/employees')}
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
              ← Back to Employees Directory
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 className="app-page-title">
                {isNew ? 'New Employee Onboarding' : `${employee?.firstName} ${employee?.lastName}`}
              </h1>
              {isNew ? (
                <span className="app-badge app-badge-info">New Onboarding</span>
              ) : (
                employee && <EmployeeStatusBadge status={employee.status} />
              )}
            </div>
            <p className="app-page-subtitle">
              {isNew
                ? 'Register full employee profile, organizational structure, shift schedule, and payroll banking configuration.'
                : `${employee?.jobTitle || 'Employee'}${employee?.departmentName ? ` · ${employee.departmentName}` : ''}${employee?.employeeNumber ? ` · #${employee.employeeNumber}` : ''}`}
            </p>
          </div>

          {!isNew && canEdit && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate(`/contracts/new?employeeId=${id}`)}
                className="app-btn app-btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Create a new contract for this employee"
              >
                <span>📑</span>
                <span>+ Create Contract</span>
              </button>

              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="app-btn app-btn-primary"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="app-btn app-btn-secondary"
                >
                  Cancel Editing
                </button>
              )}

              {employee?.status === 'active' && (
                <button
                  type="button"
                  onClick={() => setShowArchive(true)}
                  className="app-btn app-btn-danger"
                >
                  Archive
                </button>
              )}
              {employee?.status === 'archived' && (
                <button
                  type="button"
                  onClick={() => setShowRestore(true)}
                  className="app-btn"
                  style={{ background: '#059669', color: '#ffffff', border: 'none' }}
                >
                  Restore
                </button>
              )}
            </div>
          )}
        </div>

        {/* Profile Hero Card & Smart Actions for Existing Employees */}
        {!isNew && employee && (
          <>
            <div
              className="app-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                padding: '24px 28px',
              }}
            >
              <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                <EmployeeAvatar
                  avatarUrl={employee.avatarUrl}
                  firstName={employee.firstName}
                  lastName={employee.lastName}
                  size={68}
                />
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>
                    {employee.jobTitle || 'Employee'}
                    {employee.departmentName ? ` · ${employee.departmentName}` : ''}
                    {employee.location ? ` · 📍 ${employee.location}` : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <SmartButtons counts={smartCounts} />
              </div>
            </div>
          </>
        )}

        {/* Tab Navigation for existing employees */}
        {!isNew && employee && (
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
            {(['profile', 'history'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setEditing(false); }}
                style={{
                  padding: '8px 18px',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
                  background: 'none',
                  color: activeTab === tab ? '#4f46e5' : '#64748b',
                  fontWeight: activeTab === tab ? 700 : 500,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                  transition: 'color 0.15s',
                }}
              >
                {tab === 'profile' ? '👤 Profile' : '📋 History'}
              </button>
            ))}
          </div>
        )}

        {/* History Tab */}
        {!isNew && activeTab === 'history' && id && (
          <EmployeeHistoryTab employeeId={id} />
        )}

        {/* Form or Read-Only Card */}
        {(isNew || activeTab === 'profile') && (isNew || editing ? (
          <EmployeeForm
            initial={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isNew ? 'Create Employee Profile' : 'Save Changes'}
            canViewPayroll={canViewPayroll}
            currentEmployeeId={isNew ? undefined : id}
          />
        ) : (
          employee && (
            <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px' }}>
              <h3 className="app-card-title">Employee Profile Overview</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '20px',
                  fontSize: '13.5px',
                }}
              >
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Work Email
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.workEmail}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Phone
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.phone ?? '—'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Job Title / Designation
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.jobTitle ?? '—'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Department
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.departmentName || 'General / Unassigned'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Reporting Manager
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.managerName || (employee.managerId ? 'Supervisor Assigned' : 'Direct to Executive')}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Employment Type
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.employmentType.replace('_', ' ').toUpperCase()}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Work Location
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.location ?? 'Headquarters'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Joining Date
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.hireDate}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Assigned Working Schedule
                  </span>
                  <strong style={{ color: '#0f172a' }}>{employee.scheduleName || 'Standard 40h Work Week'}</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '6px' }}>
                <EmployeeContractSummary
                  contract={employee.currentContract}
                  employeeId={id}
                  employeeName={`${employee.firstName} ${employee.lastName}`}
                />
              </div>
            </div>
          )
        ))}

        {/* Dialogs */}
        {showArchive && employee && (
          <EmployeeArchiveDialog
            employeeName={`${employee.firstName} ${employee.lastName}`}
            onConfirm={handleArchive}
            onCancel={() => setShowArchive(false)}
            loading={actionLoading}
          />
        )}
        {showRestore && employee && (
          <EmployeeRestoreDialog
            employeeName={`${employee.firstName} ${employee.lastName}`}
            onConfirm={handleRestore}
            onCancel={() => setShowRestore(false)}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  );
}
