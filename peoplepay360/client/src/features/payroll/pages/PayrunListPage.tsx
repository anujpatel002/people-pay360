import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPayruns, deletePayrun } from '../services/payroll.service';
import { Payrun } from '../types/payroll.types';

const STATUS_BADGES: Record<string, { className: string; label: string }> = {
  Draft: { className: 'app-badge-neutral', label: 'Draft' },
  Computed: { className: 'app-badge-info', label: 'Computed' },
  Validated: { className: 'app-badge-warning', label: 'Validated' },
  Paid: { className: 'app-badge-success', label: 'Paid & Disbursed' },
};

export default function PayrunListPage() {
  const navigate = useNavigate();
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payrunToDelete, setPayrunToDelete] = useState<Payrun | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warningFilter, setWarningFilter] = useState('');
  const [sortBy, setSortBy] = useState<string>('period_start');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    getPayruns()
      .then((res) => {
        setPayruns(res.data || []);
      })
      .catch((err) => {
        setError(err?.response?.data?.error ?? 'Failed to load payruns');
      })
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredAndSortedPayruns = [...payruns]
    .filter((p) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(term);
        const periodMatch = `${p.period_start} ${p.period_end}`.includes(term);
        if (!nameMatch && !periodMatch) return false;
      }
      if (statusFilter && p.status !== statusFilter) {
        return false;
      }
      if (warningFilter === 'has_warnings' && !(p.warning_count > 0)) {
        return false;
      }
      if (warningFilter === 'clean' && p.warning_count > 0) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'period_start') {
        comp = new Date(a.period_start).getTime() - new Date(b.period_start).getTime();
      } else if (sortBy === 'name') {
        comp = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'total_gross') {
        comp = Number(a.total_gross || 0) - Number(b.total_gross || 0);
      } else if (sortBy === 'total_net') {
        comp = Number(a.total_net || 0) - Number(b.total_net || 0);
      } else if (sortBy === 'warning_count') {
        comp = Number(a.warning_count || 0) - Number(b.warning_count || 0);
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
    searchTerm || statusFilter || warningFilter || sortBy !== 'period_start' || sortOrder !== 'desc'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setWarningFilter('');
    setSortBy('period_start');
    setSortOrder('desc');
  };

  const totalGross = filteredAndSortedPayruns.reduce((acc, p) => acc + (Number(p.total_gross) || 0), 0);
  const totalNet = filteredAndSortedPayruns.reduce((acc, p) => acc + (Number(p.total_net) || 0), 0);

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="app-page-title">Payroll & Payruns</h1>
              <span className="app-badge app-badge-neutral">{filteredAndSortedPayruns.length} Payruns</span>
            </div>
            <p className="app-page-subtitle">
              Execute monthly payroll computation, validate salary calculations, review tax deductions, and disburse payslips
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/payroll/new')}
            className="app-btn app-btn-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Payrun</span>
          </button>
        </div>

        {/* Overview KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div className="app-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Payruns
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {filteredAndSortedPayruns.length}
            </div>
          </div>

          <div className="app-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Gross Payroll
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
              {formatCurrency(totalGross)}
            </div>
          </div>

          <div className="app-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Net Disbursed
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
              {formatCurrency(totalNet)}
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="app-filter-bar">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
              <input
                className="app-input"
                placeholder="Search payrun name or period..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">All Statuses</option>
              {['Draft', 'Computed', 'Validated', 'Paid'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              className="app-select"
              value={warningFilter}
              onChange={(e) => setWarningFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">All Verification</option>
              <option value="has_warnings">With Warnings Only</option>
              <option value="clean">Clean Only</option>
            </select>

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
                <option value="period_start">Period Start</option>
                <option value="total_net">Total Net</option>
                <option value="total_gross">Total Gross</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="warning_count">Warnings Count</option>
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
            }}
          >
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading payroll runs...
          </div>
        ) : filteredAndSortedPayruns.length === 0 ? (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>💰</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>No payruns found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
              {hasActiveFilters ? 'Try adjusting your search query or filter criteria.' : 'Create your first monthly or bi-weekly payrun to compute employee salaries and generate payslips.'}
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
                onClick={() => navigate('/payroll/new')}
                className="app-btn app-btn-primary"
              >
                + Create First Payrun
              </button>
            )}
          </div>
        ) : (
          <div className="app-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleHeaderSort('name')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Payrun Name {renderSortIndicator('name')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('period_start')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Payroll Period {renderSortIndicator('period_start')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {renderSortIndicator('status')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('total_gross')}
                    style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Total Gross {renderSortIndicator('total_gross')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('total_net')}
                    style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Total Net {renderSortIndicator('total_net')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('warning_count')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Warnings {renderSortIndicator('warning_count')}
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedPayruns.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => navigate(`/payroll/${x.id}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: '#0f172a',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {x.name}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', color: '#334155' }}>
                        {x.period_start} <span style={{ color: '#94a3b8' }}>→</span> {x.period_end}
                      </div>
                    </td>
                    <td>
                      <span className={`app-badge ${STATUS_BADGES[x.status]?.className ?? 'app-badge-neutral'}`}>
                        {STATUS_BADGES[x.status]?.label ?? x.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 650, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(x.total_gross)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(x.total_net)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {x.warning_count > 0 ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          ⚠️ {x.warning_count}
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>✓ Clean</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/payroll/${x.id}`)}
                          className="app-btn app-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Process / View →
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayrunToDelete(x)}
                          className="app-btn app-btn-subtle"
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            color: '#dc2626',
                            border: '1px solid #fee2e2',
                            background: '#fef2f2',
                          }}
                          title="Delete this payrun"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {payrunToDelete && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              className="app-card"
              style={{
                maxWidth: '480px',
                width: '100%',
                padding: '28px',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Delete Payrun
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Remove payroll run and itemized payslips
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
                Are you sure you want to delete <strong>{payrunToDelete.name}</strong> ({payrunToDelete.period_start} to {payrunToDelete.period_end})?
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPayrunToDelete(null)}
                  disabled={deletingId !== null}
                  className="app-btn app-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = payrunToDelete.id;
                    setDeletingId(id);
                    try {
                      await deletePayrun(id);
                      setPayruns((prev) => prev.filter((p) => p.id !== id));
                      setPayrunToDelete(null);
                    } catch (err: any) {
                      setError(err?.response?.data?.error ?? 'Failed to delete payrun');
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  disabled={deletingId !== null}
                  className="app-btn"
                  style={{ background: '#dc2626', color: '#ffffff', border: 'none', fontWeight: 700 }}
                >
                  {deletingId ? 'Deleting...' : 'Yes, Delete Payrun'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
