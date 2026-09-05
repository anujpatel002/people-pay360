import { EmployeeFormValues } from '../types/employee.types';

interface Props {
  values: Partial<EmployeeFormValues>;
  onChange: (patch: Partial<EmployeeFormValues>) => void;
  readOnly?: boolean;
}

export default function EmployeeScheduleInfo({ values, onChange, readOnly }: Props) {
  return (
    <section>
      <h4 style={{ margin: '0 0 12px', color: '#111827' }}>Working Schedule</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          Schedule ID
          <input
            value={values.scheduleId ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange({ scheduleId: e.target.value || undefined })}
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, width: '100%' }}
          />
        </label>
      </div>
    </section>
  );
}
