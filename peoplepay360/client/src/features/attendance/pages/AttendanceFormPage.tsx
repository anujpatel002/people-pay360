import { useState } from 'react';
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
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
      <div className="app-page">
        <div className="app-page-container" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          Loading attendance details...
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="app-page">
        <div className="app-page-container" style={{ maxWidth: '800px' }}>
          <button
            type="button"
            onClick={() => navigate('/attendance')}
            className="app-btn app-btn-secondary"
            style={{ marginBottom: '16px' }}
          >
            ← Back to Attendance
          </button>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '14px',
            }}
          >
            {error ?? 'Attendance record not found'}
          </div>
        </div>
      </div>
    );
  }

  const handleApplyCorrection = async (payload: CorrectionPayload) => {
    setActionError(null);
    try {
      await correctRecord(record.id, payload);
      await Promise.all([refetchRecord(), refetchCorrections()]);
      setIsCorrectionOpen(false);
    } catch (err: unknown) {
      setActionError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Correction failed'
      );
      throw err;
    }
  };

  return (
    <div className="app-page">
      <div className="app-page-container" style={{ maxWidth: '860px' }}>
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => navigate('/attendance')}
                className="app-btn app-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ← Back to Attendance
              </button>
              <h1 className="app-page-title">
                Attendance Record: {record.date}
              </h1>
            </div>
            <p className="app-page-subtitle">
              Employee: <strong>{record.employeeName ?? record.employeeId}</strong>{' '}
              {record.employeeNumber && `(${record.employeeNumber})`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AttendanceStatusBadge status={record.status} />
            <ExceptionFlag record={record} />
            {isHrOrAdmin && (
              <button
                type="button"
                className="app-btn app-btn-primary"
                onClick={() => setIsCorrectionOpen(true)}
              >
                ✎ Correct Record
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            {actionError}
          </div>
        )}

        {/* Primary Details Card */}
        <div className="app-card" style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            Session & Working Time
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Attendance Date
              </span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {record.date}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Working Schedule
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {record.scheduleName ?? 'Standard 40h Shift'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Check-In Timestamp
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {formatDateTime(record.checkIn)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Check-Out Timestamp
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {formatDateTime(record.checkOut)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Worked Duration
              </span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {formatMinutes(record.workedMinutes)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Overtime Duration
              </span>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: record.overtimeMinutes > 0 ? '#2563eb' : '#64748b',
                  marginTop: '2px',
                }}
              >
                {formatMinutes(record.overtimeMinutes)}
              </div>
            </div>
          </div>

          {record.isManualEntry && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 18px',
                background: '#f5f3ff',
                border: '1px solid #ddd6fe',
                borderRadius: '8px',
              }}
            >
              <h4 style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 700, color: '#6d28d9' }}>
                ✏️ Manual Correction Applied
              </h4>
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#4c1d95' }}>
                <strong>Reason:</strong> {record.correctionReason}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#7c3aed' }}>
                Corrected by <strong>{record.correctorName ?? record.correctedBy ?? 'HR Officer'}</strong> on{' '}
                {formatDateTime(record.correctedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Immutable Audit History Timeline */}
        <div className="app-card">
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            Correction Audit History ({corrections.length})
          </h3>

          {corrections.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>
              No manual corrections have been made to this record.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {corrections.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    background: '#f8fafc',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      fontSize: '12.5px',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                      Revision #{corrections.length - i}
                    </span>
                    <span style={{ color: '#64748b' }}>
                      {formatDateTime(c.correctedAt)} · by {c.correctorName ?? c.correctedBy}
                    </span>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#1e293b',
                      marginBottom: '10px',
                    }}
                  >
                    <strong>Reason:</strong> {c.correctionReason}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#dc2626', display: 'block', marginBottom: '4px' }}>
                        Before:
                      </span>
                      <div>In: {formatDateTime(c.originalCheckIn)}</div>
                      <div>Out: {formatDateTime(c.originalCheckOut)}</div>
                      <div>Worked: {formatMinutes(c.originalWorkedMinutes)}</div>
                      <div>Status: {c.originalStatus}</div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#16a34a', display: 'block', marginBottom: '4px' }}>
                        After:
                      </span>
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
    </div>
  );
}
