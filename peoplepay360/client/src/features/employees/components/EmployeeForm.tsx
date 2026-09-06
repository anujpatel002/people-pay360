import { useState, useEffect } from 'react';
import { EmployeeFormValues, EmployeeLookups } from '../types/employee.types';
import * as service from '../services/employees.service';
import EmployeePersonalInfo from './EmployeePersonalInfo';
import EmployeeWorkInfo from './EmployeeWorkInfo';
import EmployeeScheduleInfo from './EmployeeScheduleInfo';
import EmployeePayrollInfo from './EmployeePayrollInfo';

interface Props {
  initial?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  submitLabel?: string;
  canViewPayroll?: boolean;
  currentEmployeeId?: string;
}

const EMPTY: Partial<EmployeeFormValues> = { employmentType: 'full_time' };

export default function EmployeeForm({
  initial = EMPTY,
  onSubmit,
  submitLabel = 'Save Employee',
  canViewPayroll = false,
  currentEmployeeId,
}: Props) {
  const [values, setValues] = useState<Partial<EmployeeFormValues>>(initial);
  const [lookups, setLookups] = useState<EmployeeLookups | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    service.getEmployeeLookups().then(setLookups).catch(console.error);
  }, []);

  const patch = (p: Partial<EmployeeFormValues>) => setValues((v) => ({ ...v, ...p }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.firstName || !values.lastName || !values.workEmail || !values.employmentType || !values.hireDate) {
      setError('First name, last name, work email, employment type, and hire date are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(values as EmployeeFormValues);
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(apiError ?? (err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <EmployeePersonalInfo values={values} onChange={patch} />

      <EmployeeWorkInfo
        values={values}
        onChange={patch}
        lookups={lookups}
        currentEmployeeId={currentEmployeeId}
      />

      <EmployeeScheduleInfo
        values={values}
        onChange={patch}
        lookups={lookups}
      />

      {canViewPayroll && (
        <EmployeePayrollInfo values={values} onChange={patch} />
      )}

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
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

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
          type="submit"
          disabled={saving}
          className="app-btn app-btn-primary"
          style={{ minWidth: '160px', padding: '11px 24px', fontSize: '14px' }}
        >
          {saving ? (
            <>
              <span className="app-btn-spinner" />
              Saving Profile...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
