import { useState } from 'react';
import { Employee, EmployeeFormValues } from '../types/employee.types';
import EmployeePersonalInfo from './EmployeePersonalInfo';
import EmployeeWorkInfo from './EmployeeWorkInfo';
import EmployeeScheduleInfo from './EmployeeScheduleInfo';
import EmployeePayrollInfo from './EmployeePayrollInfo';

interface Props {
  initial?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  submitLabel?: string;
  canViewPayroll?: boolean;
}

const EMPTY: Partial<EmployeeFormValues> = { employmentType: 'full_time' };

export default function EmployeeForm({ initial = EMPTY, onSubmit, submitLabel = 'Save', canViewPayroll = false }: Props) {
  const [values, setValues] = useState<Partial<EmployeeFormValues>>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  const sectionStyle = { borderTop: '1px solid #e5e7eb', paddingTop: 20, marginTop: 20 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <EmployeePersonalInfo values={values} onChange={patch} />
      <div style={sectionStyle}><EmployeeWorkInfo values={values} onChange={patch} /></div>
      <div style={sectionStyle}><EmployeeScheduleInfo values={values} onChange={patch} /></div>
      {canViewPayroll && <div style={sectionStyle}><EmployeePayrollInfo values={values} onChange={patch} /></div>}

      {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: 20 }}>
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '9px 22px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
