import { useState } from 'react';

interface Props {
  requestId: string;
  status: string;
  onApprove: (id: string) => Promise<void>;
  onRefuse: (id: string, reason: string) => Promise<void>;
}

export default function ApprovalActions({ requestId, status, onApprove, onRefuse }: Props) {
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (status !== 'Confirmed') return null;

  const handleApprove = async () => {
    setLoading(true); setError('');
    try { await onApprove(requestId); }
    catch (e: any) { setError(e?.response?.data?.error ?? 'Failed to approve'); }
    finally { setLoading(false); }
  };

  const handleRefuse = async () => {
    if (!reason.trim()) { setError('Refusal reason is required'); return; }
    setLoading(true); setError('');
    try { await onRefuse(requestId, reason); setRefusing(false); setReason(''); }
    catch (e: any) { setError(e?.response?.data?.error ?? 'Failed to refuse'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {error && <p style={{ color: '#ef4444', fontSize: 12 }}>{error}</p>}
      {!refusing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleApprove} disabled={loading}
            style={{ padding: '4px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Approve
          </button>
          <button onClick={() => setRefusing(true)} disabled={loading}
            style={{ padding: '4px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Refuse
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Refusal reason (required)"
            style={{ padding: 6, borderRadius: 4, border: '1px solid #d1d5db', resize: 'vertical', minHeight: 60 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleRefuse} disabled={loading}
              style={{ padding: '4px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Confirm Refuse
            </button>
            <button onClick={() => { setRefusing(false); setReason(''); setError(''); }} disabled={loading}
              style={{ padding: '4px 12px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
