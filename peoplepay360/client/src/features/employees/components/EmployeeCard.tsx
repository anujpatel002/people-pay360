import { useNavigate } from 'react-router-dom';
import { Employee } from '../types/employee.types';
import EmployeeAvatar from './EmployeeAvatar';
import EmployeeStatusBadge from './EmployeeStatusBadge';

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-Time', part_time: 'Part-Time', contractor: 'Contractor',
};

export default function EmployeeCard({ employee }: { employee: Employee }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/employees/${employee.id}`)}
      style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
        padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 6, width: 180, textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}
    >
      <EmployeeAvatar avatarUrl={employee.avatarUrl} firstName={employee.firstName} lastName={employee.lastName} size={56} />
      <div style={{ fontWeight: 600, fontSize: 14 }}>{employee.firstName} {employee.lastName}</div>
      {employee.employeeNumber && <div style={{ fontSize: 11, color: '#6b7280' }}>{employee.employeeNumber}</div>}
      {employee.jobPositionName && <div style={{ fontSize: 12, color: '#374151' }}>{employee.jobPositionName}</div>}
      {employee.departmentName && <div style={{ fontSize: 12, color: '#6b7280' }}>{employee.departmentName}</div>}
      <div style={{ fontSize: 12, color: '#6b7280' }}>{TYPE_LABEL[employee.employmentType]}</div>
      <EmployeeStatusBadge status={employee.status} />
    </div>
  );
}
