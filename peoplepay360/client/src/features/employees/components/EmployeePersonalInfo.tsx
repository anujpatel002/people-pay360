import { EmployeeFormValues } from '../types/employee.types';

interface Props {
  values: Partial<EmployeeFormValues>;
  onChange: (patch: Partial<EmployeeFormValues>) => void;
  readOnly?: boolean;
}

export default function EmployeePersonalInfo({ values, onChange, readOnly }: Props) {
  const field = (key: keyof EmployeeFormValues) => ({
    value: (values[key] as string) ?? '',
    disabled: readOnly,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [key]: e.target.value || undefined }),
    style: { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, width: '100%' },
  });

  return (
    <section>
      <h4 style={{ margin: '0 0 12px', color: '#111827' }}>Personal Information</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>First Name<input {...field('firstName')} /></label>
        <label>Last Name<input {...field('lastName')} /></label>
        <label>Work Email<input type="email" {...field('workEmail')} /></label>
        <label>Phone<input {...field('phone')} /></label>
        <label style={{ gridColumn: '1/-1' }}>Private Address<input {...field('privateAddress')} /></label>
        <label>Emergency Contact<input {...field('emergencyContact')} /></label>
        <label>Emergency Contact Phone<input {...field('emergencyContactPhone')} /></label>
      </div>
    </section>
  );
}
