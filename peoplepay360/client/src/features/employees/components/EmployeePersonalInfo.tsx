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
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [key]: e.target.value || undefined }),
    className: 'app-input',
  });

  return (
    <div className="app-form-section">
      <div className="app-form-section-header">
        <div>
          <h4 className="app-form-section-title">
            <span style={{ fontSize: '18px' }}>👤</span> Personal & Contact Details
          </h4>
          <p className="app-form-section-subtitle">
            Primary identification, work email, personal contact number, address, and emergency contact details
          </p>
        </div>
      </div>

      <div className="app-form-grid">
        <div className="app-form-group">
          <label className="app-label">
            First Name <span className="app-label-required">*</span>
          </label>
          <input placeholder="e.g. John" {...field('firstName')} required />
        </div>

        <div className="app-form-group">
          <label className="app-label">
            Last Name <span className="app-label-required">*</span>
          </label>
          <input placeholder="e.g. Doe" {...field('lastName')} required />
        </div>

        <div className="app-form-group">
          <label className="app-label">
            Work Email <span className="app-label-required">*</span>
          </label>
          <input type="email" placeholder="john.doe@company.com" {...field('workEmail')} required />
        </div>

        <div className="app-form-group">
          <label className="app-label">Phone Number</label>
          <input type="tel" placeholder="+91 98765 43210" {...field('phone')} />
        </div>

        <div className="app-form-group app-form-group-full">
          <label className="app-label">Private Residential Address</label>
          <input placeholder="Apartment / Suite, Street Address, City, State, Postal Code" {...field('privateAddress')} />
        </div>

        <div className="app-form-group">
          <label className="app-label">Emergency Contact Name</label>
          <input placeholder="e.g. Jane Doe (Spouse)" {...field('emergencyContact')} />
        </div>

        <div className="app-form-group">
          <label className="app-label">Emergency Contact Phone</label>
          <input type="tel" placeholder="+91 98765 00000" {...field('emergencyContactPhone')} />
        </div>
      </div>
    </div>
  );
}

