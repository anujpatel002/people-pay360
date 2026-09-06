import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAttendance } from '../hooks/useAttendance';
import CheckInWidget from '../components/CheckInWidget';
import AttendanceFiltersBar from '../components/AttendanceFilters';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import ExceptionFlag from '../components/ExceptionFlag';
import AttendanceCorrectionDialog from '../components/AttendanceCorrectionDialog';
import { Attendance } from '../types/attendance.types';
import { correctRecord } from '../services/attendance.service';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import httpClient from '@/shared/services/httpClient';

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
  const [correctingRecord, setCorrectingRecord] = useState<Attendance | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<{ employeeId: string; date: string; checkIn: string; checkOut: string }[]>([]);
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: { row: number; reason: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const parseCsv = (text: string) => {
    const lines = text.trim().split('\n').filter(Boolean);
    const rows = lines.map((line) => {
      const [employeeId = '', date = '', checkIn = '', checkOut = ''] = line.split(',').map(s => s.trim());
      return { employeeId, date, checkIn, checkOut };
    });
    setCsvPreview(rows);
  };

  const handleImport = async () => {
    if (!csvPreview.length) return;
    setImporting(true);
    setImportResult(null);
    try {
      const { data } = await httpClient.post('/attendance/bulk', { rows: csvPreview });
      setImportResult(data);
      refetch();
      if (data.failed === 0) { setCsvText(''); setCsvPreview([]); }
    } catch (e: any) {
      setImportResult({ created: 0, failed: csvPreview.length, errors: [{ row: 0, reason: e?.response?.data?.error ?? 'Import failed' }] });
    } finally {
      setImporting(false);
    }
  };

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
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="app-page-title">Attendance Management</h1>
              <span className="app-badge app-badge-neutral">{total} Records</span>
            </div>
            <p className="app-page-subtitle">
              {urlEmployeeId ? `Filtered by Employee: ${urlEmployeeId}` : 'Track check-ins, worked hours, compliance, and exceptions'}
            </p>
          </div>
        </div>

        {/* Quick Self-service Check-In / Check-Out Widget */}
        <CheckInWidget onStatusChange={refetch} />

        {/* Filter Controls */}
        <div className="app-filter-bar">
          <AttendanceFiltersBar
            filters={filters}
            onChange={updateFilters}
            onReset={() => updateFilters({ search: undefined, status: undefined, dateFrom: undefined, dateTo: undefined, employeeId: undefined })}
          />
          {isHrOrAdmin && (
            <button
              type="button"
              onClick={() => { setShowImport(v => !v); setImportResult(null); }}
              className={`app-btn ${showImport ? 'app-btn-primary' : 'app-btn-secondary'}`}
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            >
              📥 {showImport ? 'Hide Import' : 'Bulk CSV Import'}
            </button>
          )}
        </div>

        {/* CSV Import Panel */}
        {isHrOrAdmin && showImport && (
          <div className="app-card" style={{ padding: '20px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>📥 Bulk Attendance Import (CSV)</h4>
            <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#64748b' }}>
              Paste CSV rows below. Format: <code style={{ background: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11.5px' }}>employeeId, date (YYYY-MM-DD), checkIn (HH:MM), checkOut (HH:MM)</code>
            </p>
            <textarea
              className="app-input"
              rows={6}
              placeholder={`EMP-10151, 2026-09-01, 09:00, 18:00\nEMP-10152, 2026-09-01, 08:45, 17:30`}
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); parseCsv(e.target.value); setImportResult(null); }}
              style={{ fontFamily: 'monospace', fontSize: '12.5px', resize: 'vertical', marginBottom: '12px' }}
            />
            {csvPreview.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Preview ({csvPreview.length} rows)</div>
                <div className="app-table-wrapper" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  <table className="app-table" style={{ fontSize: '12px' }}>
                    <thead><tr><th>#</th><th>Employee ID</th><th>Date</th><th>Check In</th><th>Check Out</th></tr></thead>
                    <tbody>
                      {csvPreview.map((r, i) => (
                        <tr key={i}><td style={{ color: '#94a3b8' }}>{i + 1}</td><td>{r.employeeId}</td><td>{r.date}</td><td>{r.checkIn}</td><td>{r.checkOut || '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {importResult && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', background: importResult.failed === 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${importResult.failed === 0 ? '#bbf7d0' : '#fecaca'}`, color: importResult.failed === 0 ? '#15803d' : '#991b1b', fontSize: '13px' }}>
                ✓ {importResult.created} created · {importResult.failed} failed
                {importResult.errors.map(e => <div key={e.row} style={{ fontSize: '11.5px', marginTop: '2px' }}>Row {e.row}: {e.reason}</div>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="app-btn app-btn-primary" onClick={handleImport} disabled={importing || csvPreview.length === 0}>
                {importing ? 'Importing...' : `Import ${csvPreview.length} Rows`}
              </button>
              <button type="button" className="app-btn app-btn-secondary" onClick={() => { setCsvText(''); setCsvPreview([]); setImportResult(null); }}>Clear</button>
            </div>
          </div>
        )}

        {error && (
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
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading attendance records...
          </div>
        ) : data.length === 0 ? (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0f172a' }}>No attendance records found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>Try selecting a different date range or adjusting your active filters.</p>
            <button
              type="button"
              onClick={() => updateFilters({ search: undefined, status: undefined, dateFrom: undefined, dateTo: undefined, employeeId: undefined, sortBy: 'date', sortOrder: 'desc' })}
              className="app-btn app-btn-secondary"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="app-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'date' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'date', sortOrder: nextOrder });
                    }}
                  >
                    Date {filters.sortBy === 'date' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'employeeName' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'employeeName', sortOrder: nextOrder });
                    }}
                  >
                    Employee {filters.sortBy === 'employeeName' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th>Schedule</th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'checkIn' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'checkIn', sortOrder: nextOrder });
                    }}
                  >
                    Check In {filters.sortBy === 'checkIn' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th>Check Out</th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'workedMinutes' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'workedMinutes', sortOrder: nextOrder });
                    }}
                  >
                    Worked Hours {filters.sortBy === 'workedMinutes' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'overtimeMinutes' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'overtimeMinutes', sortOrder: nextOrder });
                    }}
                  >
                    Overtime {filters.sortBy === 'overtimeMinutes' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'status' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'status', sortOrder: nextOrder });
                    }}
                  >
                    Status {filters.sortBy === 'status' ? (filters.sortOrder === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((record) => (
                  <tr
                    key={record.id}
                    style={{
                      background: record.status === 'Missing Check-Out' ? '#fffbeb' : undefined,
                    }}
                  >
                    <td style={{ fontWeight: 750, color: '#0f172a' }}>
                      {record.date}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#0f172a' }}>{record.employeeName ?? '—'}</strong>
                        {record.employeeNumber && (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            #{record.employeeNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '12.5px' }}>
                      {record.scheduleName ?? 'Standard'}
                    </td>
                    <td style={{ color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(record.checkIn)}
                    </td>
                    <td style={{ color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(record.checkOut)}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMinutes(record.workedMinutes)}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {record.overtimeMinutes > 0 ? (
                        <span style={{ color: '#4f46e5', fontWeight: 700 }}>
                          +{formatMinutes(record.overtimeMinutes)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AttendanceStatusBadge status={record.status} />
                        <ExceptionFlag record={record} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {isHrOrAdmin && (
                          <button
                            type="button"
                            onClick={() => setCorrectingRecord(record)}
                            className="app-btn app-btn-subtle"
                            style={{ padding: '5px 10px', fontSize: '11.5px', borderRadius: '7px' }}
                          >
                            Correct
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/attendance/${record.id}`)}
                          className="app-btn app-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11.5px', borderRadius: '7px' }}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Correction Dialog */}
        {correctingRecord && (
          <AttendanceCorrectionDialog
            record={correctingRecord}
            isOpen={!!correctingRecord}
            onClose={() => setCorrectingRecord(null)}
            onSubmit={async (payload) => {
              await correctRecord(correctingRecord.id, payload);
              setCorrectingRecord(null);
              refetch();
            }}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="app-btn app-btn-secondary"
              style={{ padding: '6px 12px' }}
            >
              ‹ Previous
            </button>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="app-btn app-btn-secondary"
              style={{ padding: '6px 12px' }}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
