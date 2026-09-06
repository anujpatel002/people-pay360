import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser, useCreateUser, useUpdateUser } from '../hooks/useUsers';
import { getContractLookups } from '@/features/contracts/services/contracts.service';
import { EmployeeLookup } from '@/features/contracts/types/contract.types';
import { UserRole } from '@/shared/types/api.types';

const ROLES: UserRole[] = ['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();

  const { data: existing, isLoading } = useUser(isEdit ? id! : '');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(id ?? '');

  const [name, setName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [employeeId, setEmployeeId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeLookup[]>([]);

  useEffect(() => {
    if (!isEdit) {
      getContractLookups()
        .then((data) => setEmployees(data.employees || []))
        .catch(() => {});
    }
  }, [isEdit]);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setWorkEmail(existing.workEmail);
      setRole(existing.role);
      setEmployeeId(existing.employeeId || '');
      setIsActive(existing.isActive);
    }
  }, [existing]);

  function handleEmployeeSelect(selectedId: string) {
    setEmployeeId(selectedId);
    const selectedEmp = employees.find((e) => e.id === selectedId);
    if (selectedEmp) {
      const empFullName = selectedEmp.name || `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim();
      if (!name && empFullName) setName(empFullName);
      if (!workEmail && selectedEmp.workEmail) setWorkEmail(selectedEmp.workEmail);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateUser.mutateAsync({ name, role, isActive });
      } else {
        await createUser.mutateAsync({ name, workEmail, password, role, employeeId });
      }
      navigate('/users');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Something went wrong';
      setError(msg);
    }
  }

  if (isEdit && isLoading) {
    return (
      <div className="app-page">
        <div className="app-page-container" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading user details...
        </div>
      </div>
    );
  }

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <div className="app-page">
      <div className="app-page-container" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="app-btn app-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ← Back
              </button>
              <h1 className="app-page-title">{isEdit ? `Edit User: ${name}` : 'New User Account'}</h1>
            </div>
            <p className="app-page-subtitle">
              {isEdit ? 'Update account details and role permissions' : 'Create a new user and assign permissions & linked employee profile'}
            </p>
          </div>
        </div>

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

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {!isEdit && employees.length > 0 && (
            <div className="app-form-group">
              <label className="app-label">Select Active Employee Profile (Quick Select)</label>
              <select
                className="app-select"
                value={employeeId}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
              >
                <option value="">-- Choose an employee from database --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()} {emp.employeeNumber ? `(${emp.employeeNumber})` : ''} - {emp.jobTitle || 'Staff'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="app-form-group">
            <label className="app-label">Full Name *</label>
            <input
              className="app-input"
              placeholder="e.g. Sarah Connor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {!isEdit && (
            <>
              <div className="app-form-group">
                <label className="app-label">Work Email *</label>
                <input
                  type="email"
                  className="app-input"
                  placeholder="e.g. sarah.c@company.com"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  required
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Password *</label>
                <input
                  type="password"
                  className="app-input"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Linked Employee ID or Badge *</label>
                <input
                  className="app-input"
                  placeholder="e.g. EMP001 or employee UUID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  Connects this login account to an employee record for self-service attendance & leaves.
                </span>
              </div>
            </>
          )}

          <div className="app-form-group">
            <label className="app-label">Assigned Role *</label>
            <select
              className="app-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {isEdit && existing?.role === 'Admin' && (
            <div style={{ padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1e40af', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Protected System Administrator</strong>
                <span>This root account is permanently active and protected from deactivation to ensure uninterrupted system management access.</span>
              </div>
            </div>
          )}

          {isEdit && (
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', marginTop: '4px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: existing?.role === 'Admin' ? '#64748b' : '#334155', cursor: existing?.role === 'Admin' ? 'not-allowed' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={existing?.role === 'Admin' ? true : isActive}
                  disabled={existing?.role === 'Admin'}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                />
                Account Active & Allowed to Sign In {existing?.role === 'Admin' && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>(Permanently Active)</span>}
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="app-btn app-btn-secondary"
              onClick={() => navigate('/users')}
              disabled={isPending}
            >
              Cancel
            </button>
            <button type="submit" className="app-btn app-btn-primary" disabled={isPending}>
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
