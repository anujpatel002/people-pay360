import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useDeactivateUser } from '../hooks/useUsers';
import { UserRole } from '@/shared/types/api.types';

const ROLES: UserRole[] = ['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];

const ROLE_BADGES: Record<string, string> = {
  Admin: 'app-badge-danger',
  'HR Manager': 'app-badge-info',
  'HR Payroll Manager': 'app-badge-warning',
  'HR Payroll User': 'app-badge-info',
  Employee: 'app-badge-neutral',
};

export default function UsersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useUsers({
    search: debouncedSearch || undefined,
    role: role || undefined,
    status: status !== 'all' ? status : undefined,
    sortBy,
    sortOrder,
    page,
    limit: 20,
  });
  const deactivate = useDeactivateUser();

  function handleDeactivate(id: string, name: string) {
    const userToDeactivate = data?.data.find((u) => u.id === id);
    if (userToDeactivate?.role === 'Admin') {
      alert('System Administrator accounts are protected and cannot be deactivated.');
      return;
    }
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    deactivate.mutate(id);
  }

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setPage(1);
  }

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setRole('');
    setStatus('all');
    setSortBy('createdAt');
    setSortOrder('DESC');
    setPage(1);
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || role || status !== 'all' || sortBy !== 'createdAt' || sortOrder !== 'DESC'
  );

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) return <span style={{ opacity: 0.25, marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: '#2563eb', marginLeft: '4px', fontWeight: 'bold' }}>{sortOrder === 'ASC' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="app-page-title">Users & Access Control</h1>
              <span className="app-badge app-badge-neutral">{data?.total ?? 0} Users</span>
            </div>
            <p className="app-page-subtitle">
              Manage application user accounts, role-based access permissions, and linked employee profiles
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/users/new')}
            className="app-btn app-btn-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New User</span>
          </button>
        </div>

        {/* Filters */}
        <div className="app-filter-bar">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
              <input
                className="app-input"
                placeholder="Search name, email, or employee..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ width: '100%', paddingLeft: '34px' }}
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
            </div>

            {/* Role Filter */}
            <select
              className="app-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              style={{ minWidth: '150px' }}
            >
              <option value="">All User Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="app-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
              style={{ minWidth: '140px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Inactive Accounts</option>
            </select>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Sort:</span>
              <select
                className="app-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                style={{ minWidth: '150px' }}
              >
                <option value="createdAt">Date Created</option>
                <option value="name">User Name</option>
                <option value="workEmail">Work Email</option>
                <option value="role">User Role</option>
                <option value="employeeName">Linked Employee</option>
                <option value="isActive">Account Status</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))}
                className="app-btn app-btn-secondary"
                style={{ padding: '7px 10px', fontSize: '13px' }}
                title={`Order: ${sortOrder === 'ASC' ? 'Ascending' : 'Descending'}`}
              >
                {sortOrder === 'ASC' ? '↑ ASC' : '↓ DESC'}
              </button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="app-btn app-btn-secondary"
                style={{ padding: '7px 12px', fontSize: '12.5px', color: '#dc2626' }}
              >
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {isError && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13.5px',
              marginBottom: '20px',
            }}
          >
            Failed to load users list. Please try again.
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading users directory...
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>No users found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
              Create a new user account or adjust your active filters.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="app-btn app-btn-secondary"
              >
                Reset All Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/users/new')}
                className="app-btn app-btn-primary"
              >
                + Create New User
              </button>
            )}
          </div>
        ) : (
          <div className="app-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('name')}
                  >
                    User Profile {renderSortIndicator('name')}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('workEmail')}
                  >
                    Work Email {renderSortIndicator('workEmail')}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('role')}
                  >
                    Assigned Role {renderSortIndicator('role')}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('employeeName')}
                  >
                    Linked Employee {renderSortIndicator('employeeName')}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('isActive')}
                  >
                    Status {renderSortIndicator('isActive')}
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{u.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '13px' }}>{u.workEmail}</td>
                    <td>
                      <span className={`app-badge ${ROLE_BADGES[u.role] ?? 'app-badge-neutral'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ color: '#334155', fontSize: '13px' }}>
                      {u.employeeName ? (
                        <span>{u.employeeName}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None (System Account)</span>
                      )}
                    </td>
                    <td>
                      {u.role === 'Admin' ? (
                        <span className="app-badge app-badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                          🛡️ Active (Protected)
                        </span>
                      ) : (
                        <span className={`app-badge ${u.isActive ? 'app-badge-success' : 'app-badge-neutral'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/users/${u.id}`)}
                          className="app-btn app-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Edit
                        </button>
                        {u.role === 'Admin' ? (
                          <span
                            title="Root Administrator accounts are permanently active and protected from deactivation"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#64748b',
                              background: '#f1f5f9',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            Permanent
                          </span>
                        ) : u.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(u.id, u.name)}
                            className="app-btn app-btn-danger"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            Deactivate
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'center', alignItems: 'center' }}>
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
