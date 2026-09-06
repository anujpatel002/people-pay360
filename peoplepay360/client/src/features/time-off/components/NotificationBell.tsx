import { useState, useEffect, useRef, useCallback } from 'react';
import { getRequests, approveRequest, refuseRequest } from '../services/time-off.service';
import { TimeOffRequest } from '../types';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<TimeOffRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await getRequests({ status: 'Confirmed', limit: 20 });
      setPending(res.data || []);
    } catch { /* silent */ }
  }, []);

  // Initial load + 30s poll
  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 30_000);
    return () => clearInterval(t);
  }, [fetch]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try { await approveRequest(id); await fetch(); } finally { setActionId(null); }
  };

  const handleRefuse = async (id: string) => {
    const reason = window.prompt('Enter refusal reason:');
    if (reason === null) return;
    setActionId(id);
    try { await refuseRequest(id, reason || 'Refused by HR'); await fetch(); } finally { setActionId(null); }
  };

  const count = pending.length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`${count} pending leave request${count !== 1 ? 's' : ''}`}
        style={{
          position: 'relative',
          background: open ? 'rgba(79,70,229,0.1)' : 'transparent',
          border: '1px solid',
          borderColor: open ? '#c7d2fe' : '#e2e8f0',
          borderRadius: '10px',
          padding: '7px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.15s ease',
          color: '#374151',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '10.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
              lineHeight: 1,
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 200,
            width: '380px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Leave Approvals</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                {count === 0 ? 'All caught up!' : `${count} request${count !== 1 ? 's' : ''} awaiting your decision`}
              </div>
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={() => { navigate('/time-off/requests'); setOpen(false); }}
                style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              >
                View All →
              </button>
            )}
          </div>

          {/* Request list */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {count === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '30px', marginBottom: '8px' }}>✅</div>
                <div style={{ fontWeight: 600, fontSize: '13.5px' }}>No pending approvals</div>
              </div>
            ) : (
              pending.map((r) => (
                <div
                  key={r.id}
                  style={{ padding: '14px 16px', borderBottom: '1px solid #f8fafc' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                        {r.employeeName || 'Employee'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {r.typeName || 'Leave'} · {r.startDate} → {r.endDate} · <strong style={{ color: '#475569' }}>{r.days}d</strong>
                      </div>
                      {r.reason && (
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', fontStyle: 'italic' }}>
                          "{r.reason}"
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '8px', flexShrink: 0, height: 'fit-content', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                      Pending
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={actionId === r.id}
                      onClick={() => handleApprove(r.id)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: '7px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      {actionId === r.id ? '...' : '✓ Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={actionId === r.id}
                      onClick={() => handleRefuse(r.id)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: '7px', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      {actionId === r.id ? '...' : '✗ Refuse'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
