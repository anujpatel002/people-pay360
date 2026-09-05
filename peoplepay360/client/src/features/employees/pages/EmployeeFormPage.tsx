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
    try { await service.archiveEmployee(id!); navigate('/employees'); }
    finally { setActionLoading(false); }
  }

  async function handleRestore() {
    setActionLoading(true);
    try { await service.restoreEmployee(id!); window.location.reload(); }
    finally { setActionLoading(false); }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error)   return <div style={{ padding: 24, color: '#dc2626' }}>{error}</div>;

  const initialValues: Partial<EmployeeFormValues> = employee
    ? {
        firstName: employee.firstName, lastName: employee.lastName,
        workEmail: employee.workEmail, phone: employee.phone,
        privateAddress: employee.privateAddress,
        emergencyContact: employee.emergencyContact,
        emergencyContactPhone: employee.emergencyContactPhone,
        jobTitle: employee.jobTitle, jobPositionId: employee.jobPositionId,
        departmentId: employee.departmentId, managerId: employee.managerId,
        employmentType: employee.employmentType, companyId: employee.companyId,
        location: employee.location, scheduleId: employee.scheduleId,
        hireDate: employee.hireDate,
        bankAccount: employee.bankAccount, iban: employee.iban, swift: employee.swift,
      }
    : { employmentType: 'full_time' };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      {employee && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
          <EmployeeAvatar avatarUrl={employee.avatarUrl} firstName={employee.firstName} lastName={employee.lastName} size={64} />
          <div>
            <h2 style={{ margin: '0 0 2px' }}>{employee.firstName} {employee.lastName}</h2>
            {employee.employeeNumber && <div style={{ color: '#6b7280', fontSize: 13 }}>{employee.employeeNumber}</div>}
            <EmployeeStatusBadge status={employee.status} />
          </div>
        </div>
      )}

      {!isNew && employee && (
        <div style={{ marginBottom: 20 }}>
          <SmartButtons counts={smartCounts} />
        </div>
      )}

      {isNew || editing ? (
        <EmployeeForm
          initial={initialValues}
          onSubmit={handleSubmit}
          submitLabel={isNew ? 'Create Employee' : 'Save Changes'}
          canViewPayroll={canViewPayroll}
        />
      ) : (
        employee && (
          <>
            {/* Read-only view sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, marginBottom: 20 }}>
              <div><span style={{ color: '#6b7280' }}>Work Email: </span>{employee.workEmail}</div>
              <div><span style={{ color: '#6b7280' }}>Phone: </span>{employee.phone ?? '—'}</div>
              <div><span style={{ color: '#6b7280' }}>Job Title: </span>{employee.jobTitle ?? '—'}</div>
              <div><span style={{ color: '#6b7280' }}>Department: </span>{employee.departmentName ?? employee.departmentId ?? '—'}</div>
              <div><span style={{ color: '#6b7280' }}>Manager: </span>{employee.managerName ?? employee.managerId ?? '—'}</div>
              <div><span style={{ color: '#6b7280' }}>Employment Type: </span>{employee.employmentType.replace('_', '-')}</div>
              <div><span style={{ color: '#6b7280' }}>Location: </span>{employee.location ?? '—'}</div>
              <div><span style={{ color: '#6b7280' }}>Hire Date: </span>{employee.hireDate}</div>
              <div><span style={{ color: '#6b7280' }}>Schedule: </span>{employee.scheduleName ?? employee.scheduleId ?? '—'}</div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginBottom: 16 }}>
              <EmployeeContractSummary contract={employee.currentContract} />
            </div>
          </>
        )
      )}

      {/* Action buttons */}
      {!isNew && canEdit && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{ padding: '8px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}
            >
              Edit
            </button>
          )}
          {editing && (
            <button
              onClick={() => setEditing(false)}
              style={{ padding: '8px 18px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 7, cursor: 'pointer' }}
            >
              Cancel
            </button>
          )}
          {employee?.status === 'active' && (
            <button
              onClick={() => setShowArchive(true)}
              style={{ padding: '8px 18px', background: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 7, cursor: 'pointer' }}
            >
              Archive
            </button>
          )}
          {employee?.status === 'archived' && (
            <button
              onClick={() => setShowRestore(true)}
              style={{ padding: '8px 18px', background: '#fff', color: '#16a34a', border: '1px solid #16a34a', borderRadius: 7, cursor: 'pointer' }}
            >
              Restore
            </button>
          )}
        </div>
      )}

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
  );
}
