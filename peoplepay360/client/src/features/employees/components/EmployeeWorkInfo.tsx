import { EmployeeFormValues, EmploymentType, EmployeeLookups } from '../types/employee.types';

interface Props {
  values: Partial<EmployeeFormValues>;
  onChange: (patch: Partial<EmployeeFormValues>) => void;
  readOnly?: boolean;
  lookups?: EmployeeLookups | null;
  currentEmployeeId?: string;
}

const COMMON_DESIGNATIONS = [
  'Senior Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Engineer',
  'QA Engineer',
  'DevOps Engineer',
  'Engineering Manager',
  'Product Manager',
  'UI/UX Designer',
  'HR Director',
  'HR Manager',
  'HR Executive',
  'Payroll Lead',
  'Payroll Specialist',
  'System Administrator',
  'Financial Analyst',
  'Account Executive',
  'Sales Operations Lead',
  'Operations Manager',
  'Customer Support Specialist',
];

const COMMON_LOCATIONS = [
  'Mumbai HQ',
  'Bangalore Office',
  'Delhi NCR Hub',
  'Hyderabad Tech Center',
  'New York Office',
  'San Francisco, USA',
  'Chicago, USA',
  'Austin, USA',
  'London, UK',
  'Remote / Work from Home',
];

export default function EmployeeWorkInfo({
  values,
  onChange,
  readOnly,
  lookups,
  currentEmployeeId,
}: Props) {
  const input = (key: keyof EmployeeFormValues) => ({
    value: (values[key] as string) ?? '',
    disabled: readOnly,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [key]: e.target.value || undefined }),
    className: 'app-input',
  });

  // Filter out current employee to prevent circular manager assignment
  const availableManagers = (lookups?.managers ?? []).filter(
    (m) => !currentEmployeeId || m.id !== currentEmployeeId
  );

  // Filter departments by selected company if companyId is present
  const availableDepartments = lookups?.departments ?? [];
  const filteredDepartments = values.companyId
    ? availableDepartments.filter((d) => !d.companyId || d.companyId === values.companyId)
    : availableDepartments;

  return (
    <div className="app-form-section">
      <div className="app-form-section-header">
        <div>
          <h4 className="app-form-section-title">
            <span style={{ fontSize: '18px' }}>🏢</span> Job & Organizational Structure
          </h4>
          <p className="app-form-section-subtitle">
            Designation, legal entity assignment, department, reporting line, and employment terms
          </p>
        </div>
      </div>

      <div className="app-form-grid">
        {/* Designation / Job Title */}
        <div className="app-form-group">
          <label className="app-label">
            Job Title / Designation <span className="app-label-required">*</span>
          </label>
          <input
            list="designation-suggestions"
            placeholder="e.g. Senior Software Engineer"
            {...input('jobTitle')}
            required
          />
          <datalist id="designation-suggestions">
            {COMMON_DESIGNATIONS.map((desig) => (
              <option key={desig} value={desig} />
            ))}
          </datalist>
        </div>

        {/* Employment Type */}
        <div className="app-form-group">
          <label className="app-label">
            Employment Type <span className="app-label-required">*</span>
          </label>
          <select
            value={values.employmentType ?? 'full_time'}
            disabled={readOnly}
            onChange={(e) => onChange({ employmentType: e.target.value as EmploymentType })}
            className="app-select"
            required
          >
            <option value="full_time">Full-Time (Regular Employee)</option>
            <option value="part_time">Part-Time</option>
            <option value="contractor">Contractor / Consultant</option>
          </select>
        </div>

        {/* Company / Legal Entity Dropdown */}
        <div className="app-form-group">
          <label className="app-label">Company / Legal Entity</label>
          <select
            value={values.companyId ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange({ companyId: e.target.value || undefined })}
            className="app-select"
          >
            <option value="">Select Company / Legal Entity...</option>
            {lookups?.companies?.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name} ({comp.code} · {comp.currencyCode})
              </option>
            ))}
          </select>
        </div>

        {/* Department Dropdown */}
        <div className="app-form-group">
          <label className="app-label">Department</label>
          <select
            value={values.departmentId ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange({ departmentId: e.target.value || undefined })}
            className="app-select"
          >
            <option value="">Select Department (or Unassigned)...</option>
            {filteredDepartments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        {/* Reporting Manager Dropdown */}
        <div className="app-form-group">
          <label className="app-label">Reporting Manager / Supervisor</label>
          <select
            value={values.managerId ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange({ managerId: e.target.value || undefined })}
            className="app-select"
          >
            <option value="">No Direct Manager (Direct to Executive / Board)</option>
            {availableManagers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.name} — {mgr.jobTitle || 'Staff'}{mgr.departmentName ? ` (${mgr.departmentName})` : ''}{mgr.employeeNumber ? ` · #${mgr.employeeNumber}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Work Location */}
        <div className="app-form-group">
          <label className="app-label">Work Location</label>
          <input
            list="location-suggestions"
            placeholder="e.g. Mumbai HQ / Remote"
            {...input('location')}
          />
          <datalist id="location-suggestions">
            {COMMON_LOCATIONS.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        {/* Joining / Hire Date */}
        <div className="app-form-group">
          <label className="app-label">
            Joining / Hire Date <span className="app-label-required">*</span>
          </label>
          <input type="date" {...input('hireDate')} required />
        </div>
      </div>
    </div>
  );
}

