import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeOffRequests, useTimeOffTypes } from '../hooks/useTimeOff';
import ApprovalActions from '../components/ApprovalActions';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

const HR_ROLES = ['HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];

const STATUS_BADGES: Record<string, { className: string; label: string }> = {
  Confirmed: { className: 'app-badge-info', label: 'Confirmed (Pending)' },
  Approved: { className: 'app-badge-success', label: 'Approved' },
  Refused: { className: 'app-badge-danger', label: 'Refused' },
  Cancelled: { className: 'app-badge-neutral', label: 'Cancelled' },
  Draft: { className: 'app-badge-neutral', label: 'Draft' },
};

export default function RequestListPage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const isHR = HR_ROLES.includes(user?.role ?? '');

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: rawData, total, loading, error, approve, refuse } = useTimeOffRequests({ limit: 100, ...filters });
  const { types } = useTimeOffTypes();

  const handleFilter = (key: string, val: string) =>
    setFilters((f) =>
      val
        ? { ...f, [key]: val }
        : Object.fromEntries(Object.entries(f).filter(([k]) => k !== key))
    );

  // Client-side search & sort on leave requests
  const filteredAndSortedData = [...rawData]
    .filter((r) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const emp = (r.employeeName || r.employeeId || '').toLowerCase();
      const type = (r.typeName || '').toLowerCase();
      const reason = (r.reason || '').toLowerCase();
      return emp.includes(term) || type.includes(term) || reason.includes(term);
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'createdAt') {
        comp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortBy === 'startDate') {
        comp = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sortBy === 'days') {
        comp = Number(a.days) - Number(b.days);
      } else if (sortBy === 'employeeName') {
        comp = (a.employeeName || a.employeeId || '').localeCompare(b.employeeName || b.employeeId || '');
      } else if (sortBy === 'typeName') {
        comp = (a.typeName || '').localeCompare(b.typeName || '');
      } else if (sortBy === 'status') {
        comp = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

  const handleHeaderSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) {
      return <span style={{ opacity: 0.3, marginLeft: '4px', fontSize: '11px' }}>⇅</span>;
    }
    return (
      <span style={{ color: 'var(--app-primary)', marginLeft: '4px', fontSize: '12px', fontWeight: 800 }}>
        {sortOrder === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    filters.status ||
    filters.typeId ||
    filters.employeeId ||
    filters.dateFrom ||
    filters.dateTo ||
    sortBy !== 'startDate' ||
    sortOrder !== 'desc'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({});
    setSortBy('startDate');
    setSortOrder('desc');
  };

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="app-page-title">Time Off & Leaves</h1>
              <span className="app-badge app-badge-neutral">{total} Total</span>
            </div>
            <p className="app-page-subtitle">
              Submit, review, and track employee leave requests, approvals, and paid-time-off balances
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/time-off/allocations')}
              className="app-btn app-btn-secondary"
            >
              Allocations
            </button>
            <button
              type="button"
              onClick={() => navigate('/time-off/types')}
              className="app-btn app-btn-secondary"
            >
              Leave Types
            </button>
            <button
              type="button"
              onClick={() => navigate('/time-off/requests/new')}
              className="app-btn app-btn-primary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="app-filter-bar">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
              <input
                className="app-input"
                placeholder="Search employee, leave type, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px', paddingRight: searchTerm ? '30px' : '12px' }}
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '13px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <select
              className="app-select"
              value={filters.typeId ?? ''}
              onChange={(e) => handleFilter('typeId', e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">All Leave Types</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              className="app-select"
              value={filters.status ?? ''}
              onChange={(e) => handleFilter('status', e.target.value)}
              style={{ minWidth: '140px' }}
            >
              <option value="">All Statuses</option>
              {['Draft', 'Confirmed', 'Approved', 'Refused', 'Cancelled'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>From:</span>
              <input
                type="date"
                className="app-input"
                value={filters.dateFrom ?? ''}
                onChange={(e) => handleFilter('dateFrom', e.target.value)}
                style={{ width: '135px', padding: '6px 8px', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>To:</span>
              <input
                type="date"
                className="app-input"
                value={filters.dateTo ?? ''}
                onChange={(e) => handleFilter('dateTo', e.target.value)}
                style={{ width: '135px', padding: '6px 8px', fontSize: '12.5px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="app-select"
                style={{ minWidth: '150px' }}
              >
                <option value="createdAt">Submission Date (Newest)</option>
                <option value="startDate">Leave Start Date</option>
                <option value="days">Total Days</option>
                <option value="employeeName">Employee Name</option>
                <option value="typeName">Leave Type</option>
                <option value="status">Status</option>
              </select>

              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="app-btn app-btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                <span>{sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="app-btn app-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px', color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13.5px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading leave requests...
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌴</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>No leave requests found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
              {hasActiveFilters ? 'Try adjusting your search terms or filter criteria.' : 'Submit a new leave request to get started.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="app-btn app-btn-secondary"
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/time-off/requests/new')}
                className="app-btn app-btn-primary"
              >
                + Submit Leave Request
              </button>
            )}
          </div>
        ) : (
          <div className="app-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleHeaderSort('employeeName')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Employee {renderSortIndicator('employeeName')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('typeName')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Leave Type {renderSortIndicator('typeName')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('startDate')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Duration / Dates {renderSortIndicator('startDate')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('days')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Total Days {renderSortIndicator('days')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {renderSortIndicator('status')}
                  </th>
                  <th>Reason / Notes</th>
                  {isHR && <th style={{ textAlign: 'right' }}>Approvals</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        >
                          {(r.employeeName || r.employeeId || 'E').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '13px', display: 'block' }}>
                            {r.employeeName || 'Staff Member'}
                          </strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 650,
                          fontSize: '12.5px',
                          color: '#1e293b',
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {r.typeName}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', color: '#1e293b' }}>
                        {r.startDate} <span style={{ color: '#94a3b8' }}>→</span> {r.endDate}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '13px',
                          color: '#0f172a',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {r.days}d
                      </span>
                    </td>
                    <td>
                      <span
                        className={`app-badge ${
                          STATUS_BADGES[r.status]?.className ?? 'app-badge-neutral'
                        }`}
                      >
                        {STATUS_BADGES[r.status]?.label ?? r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b', maxWidth: '240px' }}>
                      {r.refusalReason ? (
                        <span style={{ color: '#dc2626', fontWeight: 500 }}>
                          Refused: {r.refusalReason}
                        </span>
                      ) : (
                        r.reason || '—'
                      )}
                    </td>
                    {isHR && (
                      <td style={{ textAlign: 'right' }}>
                        <ApprovalActions
                          requestId={r.id}
                          status={r.status}
                          onApprove={approve}
                          onRefuse={refuse}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
