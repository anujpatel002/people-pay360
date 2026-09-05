import React, { useState, FormEvent } from 'react';
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
      setError('Correction reason is mandatory.');
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
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to apply correction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Correct Attendance Record</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p style={styles.subtitle}>
          Employee: <strong>{record.employeeName ?? record.employeeId}</strong> ({record.date})
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Corrected Check-In *
            <input
              type="datetime-local"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Corrected Check-Out
            <input
              type="datetime-local"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Correction Reason *
            <textarea
              placeholder="Provide justification for manual modification (e.g. system clock error, badge forgotten)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              style={{ ...styles.input, height: 75, resize: 'vertical' }}
            />
          </label>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.saveBtn}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Save Correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxWidth: 500,
    width: '100%',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0 0 1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: 6,
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    padding: '0.55rem 1.25rem',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 500,
  },
  saveBtn: {
    padding: '0.55rem 1.25rem',
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    color: '#dc2626',
    fontSize: '0.8rem',
    background: '#fee2e2',
    padding: '0.5rem 0.75rem',
    borderRadius: 6,
    marginBottom: '0.5rem',
  },
};
