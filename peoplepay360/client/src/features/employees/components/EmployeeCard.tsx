import { useNavigate } from 'react-router-dom';
import { Employee } from '../types/employee.types';
import EmployeeAvatar from './EmployeeAvatar';
import EmployeeStatusBadge from './EmployeeStatusBadge';

const TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contractor: 'Contractor',
};

export default function EmployeeCard({ employee }: { employee: Employee }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/employees/${employee.id}`)}
      className="app-card app-card-hover"
      style={{
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        flex: '1 1 270px',
        maxWidth: '340px',
        minWidth: '260px',
        boxSizing: 'border-box',
        borderRadius: '14px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Header Row: Status & Employee Number */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <EmployeeStatusBadge status={employee.status} />
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#64748b',
            background: '#f1f5f9',
            padding: '2px 7px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
          }}
        >
          {employee.employeeNumber ? `#${employee.employeeNumber}` : 'ID: ' + employee.id.slice(0, 6)}
        </span>
      </div>

      {/* Main Profile Info: Avatar, Name, Job Position */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <EmployeeAvatar
          avatarUrl={employee.avatarUrl}
          firstName={employee.firstName}
          lastName={employee.lastName}
          size={52}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: '15px',
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {employee.firstName} {employee.lastName}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#4f46e5',
              fontWeight: 650,
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {employee.jobPositionName || employee.jobTitle || 'Team Member'}
          </div>
        </div>
      </div>

      {/* Department & Location */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#475569',
          background: '#f8fafc',
          padding: '6px 10px',
          borderRadius: '8px',
        }}
      >
        <span style={{ fontSize: '13px' }}>🏢</span>
        <span style={{ fontWeight: 600 }}>{employee.departmentName ?? 'Unassigned Dept'}</span>
        {employee.location && (
          <>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ color: '#64748b' }}>{employee.location}</span>
          </>
        )}
      </div>

      {/* Contact Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#334155',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ color: '#94a3b8' }}>✉️</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{employee.workEmail}</span>
        </div>
        {employee.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <span style={{ color: '#94a3b8' }}>📞</span>
            <span>{employee.phone}</span>
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '2px 0 0 0' }} />

      {/* Bottom Footer: Employment Type + Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#475569',
            background: '#f1f5f9',
            padding: '2px 8px',
            borderRadius: '6px',
          }}
        >
          {TYPE_LABEL[employee.employmentType] || employee.employmentType}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/contracts/new?employeeId=${employee.id}`);
            }}
            className="app-btn app-btn-subtle"
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              color: '#4338ca',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Create or configure contract for this employee"
          >
            <span>📑</span>
            <span>Contract</span>
          </button>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            View →
          </span>
        </div>
      </div>
    </div>
  );
}
