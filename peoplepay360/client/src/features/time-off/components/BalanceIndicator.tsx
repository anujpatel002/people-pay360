import { useBalance } from '../hooks/useTimeOff';

interface Props { employeeId: string; }

export default function BalanceIndicator({ employeeId }: Props) {
  const { balance, loading } = useBalance(employeeId);

  if (loading) return <p style={{ color: '#888' }}>Loading balance...</p>;
  if (!balance) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {balance.balances.map(b => (
        <div key={b.typeId} style={{
          border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 16px',
          minWidth: 160, background: '#fafafa',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{b.typeName}</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>
            <div>Allocated: <strong>{b.allocated ?? 'N/A'}</strong></div>
            <div>Taken: <strong>{b.taken ?? 'N/A'}</strong></div>
            <div style={{ color: b.remaining !== null && b.remaining <= 2 ? '#ef4444' : '#16a34a' }}>
              Remaining: <strong>{b.remaining ?? 'N/A'}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
