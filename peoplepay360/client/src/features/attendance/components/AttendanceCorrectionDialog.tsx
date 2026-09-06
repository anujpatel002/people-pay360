import { useState, FormEvent } from 'react';
import { Attendance, CorrectionPayload } from '../types/attendance.types';

interface Props {
  record: Attendance;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CorrectionPayload) => Promise<void>;
}

function toLocalDatetimeInput(isoStr: string | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AttendanceCorrectionDialog({
  record,
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [checkIn, setCheckIn] = useState<string>(toLocalDatetimeInput(record.checkIn));
  const [checkOut, setCheckOut] = useState<string>(toLocalDatetimeInput(record.checkOut));
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Correction justification reason is mandatory.');
      return;
    }

    if (checkOut && new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
      setError('Check-out timestamp must be after check-in.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        checkIn: new Date(checkIn).toISOString(),
        checkOut: checkOut ? new Date(checkOut).toISOString() : null,
        correctionReason: reason.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Failed to apply correction'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="app-card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            Correct Attendance Record
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
          Modifying record for <strong>{record.employeeName ?? record.employeeId}</strong> on{' '}
          <strong>{record.date}</strong>
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="app-form-group">
            <label className="app-label">Corrected Check-In Timestamp *</label>
            <input
              type="datetime-local"
              className="app-input"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>

          <div className="app-form-group">
            <label className="app-label">Corrected Check-Out Timestamp</label>
            <input
              type="datetime-local"
              className="app-input"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>

          <div className="app-form-group">
            <label className="app-label">Correction Justification Reason *</label>
            <textarea
              className="app-input"
              placeholder="e.g. Employee forgot to clock out due to overtime meeting; approved by supervisor."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="app-btn app-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="app-btn app-btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving Correction...' : 'Save Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
