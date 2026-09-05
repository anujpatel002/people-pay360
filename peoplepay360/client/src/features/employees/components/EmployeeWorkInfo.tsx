import { EmployeeFormValues, EmploymentType } from '../types/employee.types';

interface Props {
  values: Partial<EmployeeFormValues>;
  onChange: (patch: Partial<EmployeeFormValues>) => void;
  readOnly?: boolean;
}

export default function EmployeeWorkInfo({ values, onChange, readOnly }: Props) {
  const input = (key: keyof EmployeeFormValues) => ({
    value: (values[key] as string) ?? '',
    disabled: readOnly,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [key]: e.target.value || undefined }),
    style: { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, width: '100%' },
  });

  return (
    <section>
      <h4 style={{ margin: '0 0 12px', color: '#111827' }}>Work Information</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>Job Title<input {...input('jobTitle')} /></label>
        <label>Job Position ID<input {...input('jobPositionId')} /></label>
        <label>Department ID<input {...input('departmentId')} /></label>
        <label>Manager ID<input {...input('managerId')} /></label>
        <label>
          Employment Type
          <select
            value={values.employmentType ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange({ employmentType: e.target.value as EmploymentType })}
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, width: '100%' }}
          >
            <option value="">Select…</option>
            <option value="full_time">Full-Time</option>
            <option value="part_time">Part-Time</option>
            <option value="contractor">Contractor</option>
          </select>
        </label>
        <label>Company ID<input {...input('companyId')} /></label>
        <label>Location<input {...input('location')} /></label>
        <label>Hire Date<input type="date" {...input('hireDate')} /></label>
      </div>
    </section>
  );
}
