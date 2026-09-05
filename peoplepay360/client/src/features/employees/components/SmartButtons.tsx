import { useNavigate } from 'react-router-dom';
import { SmartCounts } from '../types/employee.types';

interface Props { counts: SmartCounts; }

export default function SmartButtons({ counts }: Props) {
  const navigate = useNavigate();
  const id = counts.employeeId;

  const buttons = [
    { label: 'Contracts',   count: counts.contracts,  path: `/contracts?employeeId=${id}` },
    { label: 'Attendance',  count: counts.attendance, path: `/attendance?employeeId=${id}` },
    { label: 'Time Off',    count: counts.timeOff,    path: `/time-off?employeeId=${id}` },
    { label: 'Allocations', count: counts.allocations,path: `/time-off/allocations?employeeId=${id}` },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {buttons.map(({ label, count, path }) => (
        <button
          key={label}
          onClick={() => navigate(path)}
          style={{
            border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px',
            background: '#f9fafb', cursor: 'pointer', textAlign: 'center', minWidth: 90,
          }}
        >
          <div style={{ fontSize: 11, color: '#6b7280' }}>{label}</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{count}</div>
        </button>
      ))}
    </div>
  );
}
