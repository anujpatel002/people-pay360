import { EmployeeStatus } from '../types/employee.types';

const CONFIG: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: '#15803d', bg: '#dcfce7' },
  archived: { label: 'Archived', color: '#6b7280', bg: '#f3f4f6' },
};

export default function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const { label, color, bg } = CONFIG[status];
  return (
    <span style={{ color, background: bg, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
      ● {label}
    </span>
  );
}
