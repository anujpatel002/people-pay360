import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../hooks/useSchedules';
import { deleteSchedule } from '../services/working-schedules.service';

export default function ScheduleListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isActive, setIsActive] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: rawData, total, loading, error, refetch } = useSchedules({
    search: debouncedSearch || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
  });

  // Client-side sorting on retrieved schedules
  const sortedData = [...rawData].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'weeklyHours') {
      comparison = a.weeklyHours - b.weeklyHours;
    } else if (sortBy === 'company') {
      comparison = (a.company || '').localeCompare(b.company || '');
    } else if (sortBy === 'timezone') {
      comparison = (a.timezone || '').localeCompare(b.timezone || '');
    } else if (sortBy === 'isActive') {
      comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleHeaderSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
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

  const hasActiveFilters = Boolean(search || isActive !== '' || sortBy !== 'name' || sortOrder !== 'asc');

  const handleClearFilters = () => {
    setSearch('');
    setIsActive('');
    setSortBy('name');
    setSortOrder('asc');
  };

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete working schedule "${name}"?`)) return;
    try {
      await deleteSchedule(id);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Cannot delete schedule';
      alert(msg);
    }
  }

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="app-page-title">Working Schedules</h1>
              <span className="app-badge app-badge-neutral">{total} Total</span>
            </div>
            <p className="app-page-subtitle">
              Define standard weekly work shifts, break durations, and baseline hours for payroll & attendance
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/working-schedules/new')}
            className="app-btn app-btn-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Schedule</span>
          </button>
        </div>

        {/* Filters & Sorting Toolbar */}
        <div className="app-filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
              <input
                className="app-input"
                placeholder="Search schedule name or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px', paddingRight: search ? '30px' : '14px' }}
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
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
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

            <select
              className="app-select"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
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
                <option value="name">Schedule Name</option>
                <option value="weeklyHours">Weekly Hours</option>
                <option value="company">Company</option>
                <option value="timezone">Timezone</option>
                <option value="isActive">Active Status</option>
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
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading working schedules...
          </div>
        ) : sortedData.length === 0 ? (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏰</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>No schedules found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
              {hasActiveFilters ? 'Try adjusting your search criteria.' : 'Create standard work schedules to calculate employee overtime, leaves, and expected hours.'}
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
          <div className="app-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleHeaderSort('name')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Schedule Name {renderSortIndicator('name')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('company')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Company {renderSortIndicator('company')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('timezone')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Timezone {renderSortIndicator('timezone')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('weeklyHours')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Weekly Hours {renderSortIndicator('weeklyHours')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('isActive')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {renderSortIndicator('isActive')}
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((sch) => (
                  <tr key={sch.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          🕒
                        </div>
                        <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{sch.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{sch.company}</td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          color: '#475569',
                          background: '#f8fafc',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {sch.timezone}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '13px',
                          color: '#0f172a',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          padding: '3px 10px',
                          borderRadius: '20px',
                        }}
                      >
                        {sch.weeklyHours}h / week
                      </span>
                    </td>
                    <td>
                      <span
                        className={`app-badge ${
                          sch.isActive ? 'app-badge-success' : 'app-badge-neutral'
                        }`}
                      >
                        {sch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/working-schedules/${sch.id}`)}
                          className="app-btn app-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(sch.id, sch.name)}
                          className="app-btn app-btn-danger"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
