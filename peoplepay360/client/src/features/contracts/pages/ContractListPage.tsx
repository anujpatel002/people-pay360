import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContracts } from '../hooks/useContracts';
import ActiveContractBadge from '../components/ActiveContractBadge';
import { ContractStatus } from '../types/contract.types';

const STATUSES: ContractStatus[] = ['New', 'Running', 'Expired', 'Cancelled'];

const SORT_OPTIONS = [
  { value: 'startDate', label: 'Start Date' },
  { value: 'wage', label: 'Monthly Wage' },
  { value: 'endDate', label: 'End Date' },
  { value: 'status', label: 'Contract Status' },
  { value: 'contractRef', label: 'Contract Reference' },
  { value: 'employeeName', label: 'Employee Name' },
];

export default function ContractListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [employeeId] = useState(searchParams.get('employeeId') ?? undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, total, loading, error } = useContracts({
    employeeId,
    search: debouncedSearch || undefined,
    status: status || undefined,
    department: department || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 20,
  });

  const totalPages = Math.ceil(total / 20) || 1;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleHeaderSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const hasActiveFilters = Boolean(debouncedSearch || status || department || sortBy !== 'startDate' || sortOrder !== 'desc');

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setStatus('');
    setDepartment('');
    setSortBy('startDate');
    setSortOrder('desc');
    setPage(1);
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

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="app-page-title">Contracts Management</h1>
              <span className="app-badge app-badge-neutral">{total} Total</span>
              {employeeId && (
                <span className="app-badge app-badge-info">Filtered by Employee</span>
              )}
            </div>
            <p className="app-page-subtitle">
              Manage employment contracts, salary structures, wage terms, and renewal dates
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/contracts/new')}
            className="app-btn app-btn-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Contract</span>
          </button>
        </div>

        {/* Search, Filters & Sorting Toolbar */}
        <div className="app-filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
              <input
                className="app-input"
                placeholder="Search contract ref, employee, department, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px', paddingRight: searchTerm ? '32px' : '14px' }}
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
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
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '14px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="app-select"
              style={{ minWidth: '160px' }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Department Filter Input */}
            <input
              placeholder="Filter by Department..."
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="app-input"
              style={{ width: '190px' }}
            />

            {/* Sort Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="app-select"
                style={{ minWidth: '150px' }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="app-btn app-btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px', gap: '4px' }}
                title={sortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
              >
                <span>{sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}</span>
              </button>
            </div>

            {/* Clear Filters Button */}
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
            Loading contracts...
          </div>
        ) : data.length === 0 ? (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0f172a' }}>No contracts found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
              {hasActiveFilters ? 'Try adjusting your search terms or filter criteria.' : 'Create a contract to get started with payroll setup.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="app-btn app-btn-secondary"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="app-table-wrapper contracts-table-wrapper">
            <table className="app-table contracts-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleHeaderSort('contractRef')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Contract Ref {renderSortIndicator('contractRef')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('employeeName')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Employee {renderSortIndicator('employeeName')}
                  </th>
                  <th>Department / Job</th>
                  <th
                    onClick={() => handleHeaderSort('startDate')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Start Date {renderSortIndicator('startDate')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('endDate')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    End Date {renderSortIndicator('endDate')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('wage')}
                    style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Wage / Month {renderSortIndicator('wage')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {renderSortIndicator('status')}
                  </th>
                  <th className="contracts-actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr
                    key={c.id}
                    style={{
                      background: c.status === 'Running' ? '#f0fdf4' : undefined,
                    }}
                  >
                    <td>
                      <span
                        style={{
                          fontWeight: 750,
                          color: '#0f172a',
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        {c.contractRef || '—'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>
                        {c.employeeName || 'Staff Member'}
                      </strong>
                    </td>
                    <td style={{ color: '#475569', fontSize: '12.5px' }}>
                      {c.department || c.jobPosition ? (
                        <>
                          {c.department && <span>{c.department}</span>}
                          {c.department && c.jobPosition && ' · '}
                          {c.jobPosition && <span style={{ color: '#64748b' }}>{c.jobPosition}</span>}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ color: '#1e293b' }}>{c.startDate}</td>
                    <td style={{ color: c.endDate ? '#1e293b' : '#059669', fontWeight: c.endDate ? 500 : 700 }}>
                      {c.endDate ?? 'Open-ended'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(c.wage)}
                    </td>
                    <td>
                      <ActiveContractBadge status={c.status} />
                    </td>
                    <td className="contracts-actions-column">
                      <button
                        type="button"
                        onClick={() => navigate(`/contracts/${c.id}`)}
                        className="app-btn app-btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '7px' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center', alignItems: 'center' }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
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

