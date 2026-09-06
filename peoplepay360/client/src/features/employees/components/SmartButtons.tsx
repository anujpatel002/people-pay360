import { useNavigate } from 'react-router-dom';
import { SmartCounts } from '../types/employee.types';

interface Props {
  counts: SmartCounts;
}

export default function SmartButtons({ counts }: Props) {
  const navigate = useNavigate();
  const id = counts.employeeId;

  const buttons = [
    { label: 'Contracts', count: counts.contracts, icon: '📑', path: `/contracts?employeeId=${id}` },
    { label: 'Attendance', count: counts.attendance, icon: '⏱️', path: `/attendance?employeeId=${id}` },
    { label: 'Time Off', count: counts.timeOff, icon: '🌴', path: `/time-off/requests?employeeId=${id}` },
    { label: 'Allocations', count: counts.allocations, icon: '📊', path: `/time-off/allocations?employeeId=${id}` },
  ];

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {buttons.map(({ label, count, icon, path }) => (
        <button
          key={label}
          type="button"
          onClick={() => navigate(path)}
          className="app-card-hover"
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '8px 16px',
            background: '#ffffff',
            cursor: 'pointer',
            textAlign: 'left',
            minWidth: '110px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: '12px' }}>{icon}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '17px', color: '#0f172a' }}>{count}</div>
        </button>
      ))}
    </div>
  );
}
