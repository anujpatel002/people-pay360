import { EmployeeFormValues } from '../types/employee.types';

interface Props {
  values: Partial<EmployeeFormValues>;
  onChange: (patch: Partial<EmployeeFormValues>) => void;
  readOnly?: boolean;
}

export default function EmployeePayrollInfo({ values, onChange, readOnly }: Props) {
  const input = (key: keyof EmployeeFormValues) => ({
    value: (values[key] as string) ?? '',
    disabled: readOnly,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [key]: e.target.value || undefined }),
    style: { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, width: '100%' },
  });

  return (
    <section>
      <h4 style={{ margin: '0 0 12px', color: '#111827' }}>Payroll Information</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>Bank Account<input {...input('bankAccount')} /></label>
        <label>IBAN<input {...input('iban')} /></label>
        <label>SWIFT<input {...input('swift')} /></label>
      </div>
    </section>
  );
}
