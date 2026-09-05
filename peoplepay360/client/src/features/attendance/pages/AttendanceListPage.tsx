import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAttendance } from '../hooks/useAttendance';
import CheckInWidget from '../components/CheckInWidget';
import AttendanceFiltersBar from '../components/AttendanceFilters';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import ExceptionFlag from '../components/ExceptionFlag';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AttendanceListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role } = useCurrentUser();

  const urlEmployeeId = searchParams.get('employeeId') ?? undefined;
  const isHrOrAdmin = role && ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'].includes(role);

  const {
    data,
    total,
    page,
    limit,
    filters,
    updateFilters,
    setPage,
    loading,
    error,
    refetch,
  } = useAttendance({
    employeeId: urlEmployeeId,
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Attendance</h2>
          <p style={styles.subtitle}>
            {urlEmployeeId ? `Filtered by Employee: ${urlEmployeeId}` : 'Track and manage check-ins, worked hours, and exceptions'}
          </p>
        </div>
      </div>

      {/* Quick Self-service Check-In / Check-Out Widget */}
      <CheckInWidget onStatusChange={refetch} />

      {/* Filter Controls */}
      <AttendanceFiltersBar
        filters={filters}
        onChange={updateFilters}
        onReset={() => updateFilters({ search: undefined, status: undefined, dateFrom: undefined, dateTo: undefined, employeeId: undefined })}
      />

      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p style={styles.muted}>Loading attendance records...</p>
      ) : data.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No attendance records found.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Date', 'Employee', 'Schedule', 'Check In', 'Check Out', 'Worked Hours', 'Overtime', 'Status', ''].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((record) => (
                <tr
                  key={record.id}
                  style={record.status === 'Missing Check-Out' ? styles.warningRow : undefined}
                >
                  <td style={styles.td}>
                    <strong>{record.date}</strong>
                  </td>
                  <td style={styles.td}>
                    <div>{record.employeeName ?? record.employeeId}</div>
                    {record.employeeNumber && (
                      <span style={styles.empNum}>{record.employeeNumber}</span>
                    )}
                  </td>
                  <td style={styles.td}>{record.scheduleName ?? '—'}</td>
                  <td style={styles.td}>{formatTime(record.checkIn)}</td>
                  <td style={styles.td}>
                    {record.checkOut ? (
                      formatTime(record.checkOut)
                    ) : (
                      <span style={styles.openBadge}>Open</span>
                    )}
                  </td>
                  <td style={styles.td}>{formatMinutes(record.workedMinutes)}</td>
                  <td style={styles.td}>
                    {record.overtimeMinutes > 0 ? (
                      <span style={styles.otBadge}>+{formatMinutes(record.overtimeMinutes)}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <AttendanceStatusBadge status={record.status} />
                      <ExceptionFlag record={record} />
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={styles.detailBtn}
                      onClick={() => navigate(`/attendance/${record.id}`)}
                    >
                      {isHrOrAdmin ? 'View / Edit' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div style={styles.pagination}>
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          style={styles.pageBtn}
        >
          ← Prev
        </button>
        <span style={styles.muted}>
          Page {page} of {totalPages} ({total} total records)
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          style={styles.pageBtn}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '1.5rem 2rem',
    maxWidth: 1200,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitle: {
    margin: '0.25rem 0 0',
    fontSize: '0.875rem',
    color: '#64748b',
  },
  tableWrapper: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: 600,
    background: '#f8fafc',
  },
  td: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '0.875rem',
    verticalAlign: 'middle',
  },
  warningRow: {
    background: '#fff7ed',
  },
  empNum: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  openBadge: {
    padding: '0.15rem 0.5rem',
    background: '#e0f2fe',
    color: '#0369a1',
    borderRadius: 4,
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  otBadge: {
    color: '#2563eb',
    fontWeight: 600,
  },
  detailBtn: {
    padding: '0.35rem 0.85rem',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#334155',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.25rem',
    justifyContent: 'center',
  },
  pageBtn: {
    padding: '0.4rem 1rem',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    cursor: 'pointer',
    background: '#ffffff',
    fontSize: '0.875rem',
  },
  muted: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  error: {
    color: '#dc2626',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  emptyState: {
    padding: '3rem 1rem',
    textAlign: 'center',
    background: '#f8fafc',
    border: '1px dashed #cbd5e1',
    borderRadius: 8,
  },
  emptyText: {
    color: '#64748b',
    margin: 0,
  },
};
