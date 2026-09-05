import { useNavigate } from 'react-router-dom';
import { CurrentContractSummary } from '../types/employee.types';

export default function EmployeeContractSummary({ contract }: { contract?: CurrentContractSummary }) {
  const navigate = useNavigate();

  if (!contract) {
    return (
      <section>
        <h4 style={{ margin: '0 0 12px', color: '#111827' }}>Current Contract</h4>
        <p style={{ color: '#6b7280', fontSize: 13 }}>No active contract.</p>
      </section>
    );
  }

  return (
    <section>
      <h4 style={{ margin: '0 0 12px', color: '#111827' }}>Current Contract</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
        <div><span style={{ color: '#6b7280' }}>Reference: </span>{contract.referenceCode}</div>
        <div><span style={{ color: '#6b7280' }}>Status: </span>{contract.status}</div>
        <div><span style={{ color: '#6b7280' }}>Start: </span>{contract.startDate}</div>
        <div><span style={{ color: '#6b7280' }}>End: </span>{contract.endDate ?? '—'}</div>
        {contract.structureName && (
          <div><span style={{ color: '#6b7280' }}>Structure: </span>{contract.structureName}</div>
        )}
      </div>
      <button
        onClick={() => navigate(`/contracts/${contract.id}`)}
        style={{ marginTop: 10, padding: '6px 14px', borderRadius: 6, border: '1px solid #4f46e5', color: '#4f46e5', background: 'transparent', cursor: 'pointer' }}
      >
        View Contract
      </button>
    </section>
  );
}
