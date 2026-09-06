import { useBalance } from '../hooks/useTimeOff';

interface Props {
  employeeId: string;
}

export default function BalanceIndicator({ employeeId }: Props) {
  const { balance, loading } = useBalance(employeeId);

  if (loading) {
    return (
      <div style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>
        Loading balances...
      </div>
    );
  }
  if (!balance || !balance.balances?.length) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}
    >
      {balance.balances.map((b) => {
        const remaining = b.remaining ?? 0;
        const allocated = b.allocated ?? 0;
        const isLow = b.remaining !== null && b.remaining <= 2;

        return (
          <div
            key={b.typeId}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px',
              background: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                {b.typeName}
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isLow ? '#fef2f2' : '#ecfdf5',
                  color: isLow ? '#dc2626' : '#166534',
                  border: isLow ? '1px solid #fecaca' : '1px solid #a7f3d0',
                }}
              >
                {b.remaining !== null ? `${b.remaining} left` : 'Unrestricted'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748b',
                marginTop: '4px',
              }}
            >
              <span>Allocated: <strong style={{ color: '#1e293b' }}>{allocated}d</strong></span>
              <span>Taken: <strong style={{ color: '#1e293b' }}>{b.taken ?? 0}d</strong></span>
            </div>

            {/* Micro progress bar */}
            {allocated > 0 && (
              <div
                style={{
                  height: '4px',
                  background: '#f1f5f9',
                  borderRadius: '2px',
                  marginTop: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, ((b.taken ?? 0) / allocated) * 100)}%`,
                    background: isLow ? '#ef4444' : 'var(--primary-600)',
                    borderRadius: '2px',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
