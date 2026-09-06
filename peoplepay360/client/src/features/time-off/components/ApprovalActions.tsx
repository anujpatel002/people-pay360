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

  if (status !== 'Draft' && status !== 'Confirmed' && status !== 'Pending') return null;

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      await onApprove(requestId);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleRefuse = async () => {
    if (!reason.trim()) {
      setError('Refusal reason is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onRefuse(requestId, reason);
      setRefusing(false);
      setReason('');
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to refuse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {error && (
        <span style={{ color: '#dc2626', fontSize: '11.5px', fontWeight: 600 }}>{error}</span>
      )}
      {!refusing ? (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="app-btn app-btn-success"
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>✓</span>
            <span>{loading ? '...' : 'Approve'}</span>
          </button>
          <button
            type="button"
            onClick={() => setRefusing(true)}
            disabled={loading}
            className="app-btn app-btn-danger"
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>✕</span>
            <span>Refuse</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: '#ffffff',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for refusal (required)..."
            className="app-input"
            style={{
              padding: '6px',
              fontSize: '12px',
              minHeight: '50px',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setRefusing(false);
                setReason('');
                setError('');
              }}
              disabled={loading}
              className="app-btn app-btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11.5px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRefuse}
              disabled={loading}
              className="app-btn app-btn-danger"
              style={{ padding: '3px 8px', fontSize: '11.5px' }}
            >
              {loading ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
