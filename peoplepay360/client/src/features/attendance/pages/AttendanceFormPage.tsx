import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAttendanceRecord } from '../hooks/useAttendanceRecord';
import { useAttendanceCorrections } from '../hooks/useAttendanceCorrections';
import { correctRecord } from '../services/attendance.service';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import ExceptionFlag from '../components/ExceptionFlag';
import AttendanceCorrectionDialog from '../components/AttendanceCorrectionDialog';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { CorrectionPayload } from '../types/attendance.types';

function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m (${minutes} mins)`;
}

function formatDateTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

export default function AttendanceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useCurrentUser();

  const isHrOrAdmin = role && ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'].includes(role);

  const { record, loading, error, refetch: refetchRecord } = useAttendanceRecord(id);
  const { corrections, refetch: refetchCorrections } = useAttendanceCorrections(id);

  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.muted}>Loading attendance details...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/attendance')}>← Back to List</button>
        <p style={styles.error}>{error ?? 'Attendance record not found'}</p>
      </div>
    );
  }

  const handleApplyCorrection = async (payload: CorrectionPayload) => {
    setActionError(null);
    try {
      await correctRecord(record.id, payload);
      await Promise.all([refetchRecord(), refetchCorrections()]);
    } catch (err: unknown) {
      setActionError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Correction failed');
      throw err;
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topNav}>
        <button style={styles.backBtn} onClick={() => navigate('/attendance')}>← Back to Attendance</button>
        {isHrOrAdmin && (
          <button
            style={styles.correctBtn}
            onClick={() => setIsCorrectionOpen(true)}
          >
            ✎ Correct Attendance
          </button>
        )}
      </div>

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Attendance: {record.date}</h2>
          <p style={styles.subtitle}>
            {record.employeeName ?? record.employeeId} {record.employeeNumber && `(${record.employeeNumber})`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AttendanceStatusBadge status={record.status} />
          <ExceptionFlag record={record} />
        </div>
      </div>

      {actionError && <p style={styles.error}>{actionError}</p>}

      {/* Primary Details Card */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Session & Working Time</h3>
        <div style={styles.grid}>
          <div style={styles.field}>
            <label style={styles.label}>Attendance Date</label>
            <div style={styles.value}>{record.date}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Working Schedule</label>
            <div style={styles.value}>{record.scheduleName ?? 'Standard 40h'}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Check-In Timestamp</label>
            <div style={styles.value}>{formatDateTime(record.checkIn)}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Check-Out Timestamp</label>
            <div style={styles.value}>{formatDateTime(record.checkOut)}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Worked Duration</label>
            <div style={styles.highlightValue}>{formatMinutes(record.workedMinutes)}</div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Overtime</label>
            <div style={record.overtimeMinutes > 0 ? styles.otValue : styles.value}>
              {formatMinutes(record.overtimeMinutes)}
            </div>
          </div>
        </div>

        {record.isManualEntry && (
          <div style={styles.manualNotice}>
            <h4 style={styles.manualTitle}>Manual Correction Applied</h4>
            <p style={styles.manualText}><strong>Reason:</strong> {record.correctionReason}</p>
            <p style={styles.manualText}>
              <strong>Corrected By:</strong> {record.correctorName ?? record.correctedBy ?? 'HR Officer'} on {formatDateTime(record.correctedAt)}
            </p>
          </div>
        )}
      </div>

      {/* Immutable Audit History Timeline */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>Correction Audit History</h3>
        {corrections.length === 0 ? (
          <p style={styles.muted}>No manual corrections have been made to this record.</p>
        ) : (
          <div style={styles.timeline}>
            {corrections.map((c, i) => (
              <div key={c.id} style={styles.timelineItem}>
                <div style={styles.timelineHeader}>
                  <span style={styles.timelineIdx}>Revision #{corrections.length - i}</span>
                  <span style={styles.timelineDate}>{formatDateTime(c.correctedAt)}</span>
                  <span style={styles.timelineUser}>by {c.correctorName ?? c.correctedBy}</span>
                </div>
                <div style={styles.reasonBox}>
                  <strong>Reason:</strong> {c.correctionReason}
                </div>
                <div style={styles.diffGrid}>
                  <div style={styles.diffCol}>
                    <span style={styles.diffLabel}>Before:</span>
                    <div>In: {formatDateTime(c.originalCheckIn)}</div>
                    <div>Out: {formatDateTime(c.originalCheckOut)}</div>
                    <div>Worked: {formatMinutes(c.originalWorkedMinutes)}</div>
                    <div>Status: {c.originalStatus}</div>
                  </div>
                  <div style={styles.diffCol}>
                    <span style={styles.diffLabel}>After:</span>
                    <div>In: {formatDateTime(c.correctedCheckIn)}</div>
                    <div>Out: {formatDateTime(c.correctedCheckOut)}</div>
                    <div>Worked: {formatMinutes(c.correctedWorkedMinutes)}</div>
                    <div>Status: {c.correctedStatus}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isHrOrAdmin && (
        <AttendanceCorrectionDialog
          record={record}
          isOpen={isCorrectionOpen}
          onClose={() => setIsCorrectionOpen(false)}
          onSubmit={handleApplyCorrection}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '1.5rem 2rem',
    maxWidth: 900,
    margin: '0 auto',
  },
  topNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  backBtn: {
    padding: '0.4rem 0.85rem',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  correctBtn: {
    padding: '0.45rem 1.1rem',
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitle: {
    margin: '0.25rem 0 0',
    fontSize: '0.95rem',
    color: '#64748b',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    margin: '0 0 1.25rem',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1e293b',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '0.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  label: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
    fontWeight: 600,
  },
  value: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#1e293b',
  },
  highlightValue: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  otValue: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#2563eb',
  },
  manualNotice: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: '#f8fafc',
    borderLeft: '4px solid #8b5cf6',
    borderRadius: 6,
  },
  manualTitle: {
    margin: '0 0 0.5rem',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#6d28d9',
  },
  manualText: {
    margin: '0.2rem 0',
    fontSize: '0.85rem',
    color: '#334155',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  timelineItem: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '1rem',
    background: '#f8fafc',
  },
  timelineHeader: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
  },
  timelineIdx: {
    fontWeight: 700,
    color: '#4f46e5',
  },
  timelineDate: {
    color: '#64748b',
  },
  timelineUser: {
    fontWeight: 500,
    color: '#334155',
  },
  reasonBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: '0.5rem 0.75rem',
    fontSize: '0.85rem',
    marginBottom: '0.75rem',
    color: '#1e293b',
  },
  diffGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    fontSize: '0.8rem',
  },
  diffCol: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: '0.5rem 0.75rem',
    color: '#475569',
  },
  diffLabel: {
    fontWeight: 700,
    color: '#0f172a',
    display: 'block',
    marginBottom: '0.25rem',
  },
  muted: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  error: {
    color: '#dc2626',
    fontSize: '0.875rem',
    margin: '0 0 1rem',
  },
};
