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
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [key]: e.target.value || undefined }),
    className: 'app-input',
    style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  });

  return (
    <div className="app-form-section">
      <div className="app-form-section-header">
        <div>
          <h4 className="app-form-section-title">
            <span style={{ fontSize: '18px' }}>💳</span> Payroll & Banking Details
          </h4>
          <p className="app-form-section-subtitle">
            Direct salary deposit credentials for monthly payroll processing and payslip disbursement
          </p>
        </div>
      </div>

      <div className="app-form-grid">
        <div className="app-form-group">
          <label className="app-label">Bank Account Number</label>
          <input placeholder="e.g. 123456789012" {...input('bankAccount')} />
        </div>

        <div className="app-form-group">
          <label className="app-label">IBAN / IFSC Code</label>
          <input placeholder="e.g. HDFC0001234 / GB29..." {...input('iban')} />
        </div>

        <div className="app-form-group">
          <label className="app-label">SWIFT / BIC Code</label>
          <input placeholder="e.g. HDFCINBBXXX" {...input('swift')} />
        </div>
      </div>
    </div>
  );
}

