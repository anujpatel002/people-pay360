import { useNavigate } from 'react-router-dom';
import { CurrentContractSummary } from '../types/employee.types';

export default function EmployeeContractSummary({
  contract,
  employeeId,
  employeeName,
}: {
  contract?: CurrentContractSummary;
  employeeId?: string;
  employeeName?: string;
}) {
  const navigate = useNavigate();

  if (!contract) {
    return (
      <div
        style={{
          border: '1px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '20px 24px',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <span style={{ fontSize: '18px' }}>📑</span>
            <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
              No Active Employment Contract
            </h4>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
            {employeeName ? `${employeeName} does not have an active contract registered.` : 'No contract linked yet.'}
          </p>
        </div>

        {employeeId && (
          <button
            type="button"
            onClick={() => navigate(`/contracts/new?employeeId=${employeeId}`)}
            className="app-btn app-btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create Contract</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '18px 22px',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📑</span>
          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
            Current Employment Contract
          </h4>
          <span
            className={`app-badge ${
              contract.status === 'active' ? 'app-badge-success' : 'app-badge-info'
            }`}
            style={{ textTransform: 'capitalize' }}
          >
            {contract.status}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate(`/contracts/${contract.id}`)}
            className="app-btn app-btn-secondary"
            style={{ padding: '5px 12px', fontSize: '12.5px' }}
          >
            View Contract →
          </button>
          {employeeId && (
            <button
              type="button"
              onClick={() => navigate(`/contracts/new?employeeId=${employeeId}`)}
              className="app-btn app-btn-subtle"
              style={{ padding: '5px 10px', fontSize: '12px', border: '1px solid #e2e8f0' }}
              title="Create another contract for this employee"
            >
              + New Contract
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          fontSize: '13px',
        }}
      >
        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '11.5px', fontWeight: 650, textTransform: 'uppercase' }}>
            Contract Ref
          </span>
          <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '13.5px' }}>
            {contract.referenceCode || '—'}
          </strong>
        </div>

        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '11.5px', fontWeight: 650, textTransform: 'uppercase' }}>
            Start Date
          </span>
          <span style={{ color: '#1e293b', fontWeight: 650 }}>{contract.startDate}</span>
        </div>

        <div>
          <span style={{ color: '#64748b', display: 'block', fontSize: '11.5px', fontWeight: 650, textTransform: 'uppercase' }}>
            End Date
          </span>
          <span style={{ color: contract.endDate ? '#1e293b' : '#059669', fontWeight: 650 }}>
            {contract.endDate ?? 'Open-ended (Permanent)'}
          </span>
        </div>

        {contract.structureName && (
          <div>
            <span style={{ color: '#64748b', display: 'block', fontSize: '11.5px', fontWeight: 650, textTransform: 'uppercase' }}>
              Salary Structure
            </span>
            <span style={{ color: '#1e293b', fontWeight: 650 }}>{contract.structureName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
