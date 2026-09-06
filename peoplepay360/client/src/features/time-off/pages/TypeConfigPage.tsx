import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeOffTypes } from '../hooks/useTimeOff';
import { TimeOffType } from '../types';

export default function TypeConfigPage() {
  const navigate = useNavigate();
  const { types, loading, error, create, update } = useTimeOffTypes();
  const [form, setForm] = useState<Partial<TimeOffType>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // List filters & sort
  const [searchTerm, setSearchTerm] = useState('');
  const [paidFilter, setPaidFilter] = useState<string>('');
  const [allocFilter, setAllocFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const reset = () => {
    setForm({});
    setEditing(null);
    setFormError('');
  };

  const startEdit = (t: TimeOffType) => {
    setEditing(t.id);
    setForm({
      name: t.name,
      unit: t.unit,
      allocationRequired: t.allocationRequired,
      approvalMode: t.approvalMode,
      isPaid: t.isPaid,
      color: t.color ?? '',
      notes: t.notes ?? '',
      isActive: t.isActive,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.unit) {
      setFormError('Name and unit are required');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editing) await update(editing, form);
      else await create(form);
      reset();
    } catch (e: any) {
      setFormError(e?.response?.data?.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredAndSortedTypes = [...types]
    .filter((t) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = (t.name || '').toLowerCase().includes(term);
        const matchNotes = (t.notes || '').toLowerCase().includes(term);
        if (!matchName && !matchNotes) return false;
      }
      if (paidFilter !== '') {
        const isPaid = paidFilter === 'true';
        if (t.isPaid !== isPaid) return false;
      }
      if (allocFilter !== '') {
        const req = allocFilter === 'true';
        if (t.allocationRequired !== req) return false;
      }
      if (activeFilter !== '') {
        const act = activeFilter === 'true';
        if (t.isActive !== act) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') {
        comp = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'unit') {
        comp = (a.unit || '').localeCompare(b.unit || '');
      } else if (sortBy === 'isPaid') {
        comp = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
      } else if (sortBy === 'allocationRequired') {
        comp = (a.allocationRequired ? 1 : 0) - (b.allocationRequired ? 1 : 0);
      } else if (sortBy === 'isActive') {
        comp = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
      }
      return sortOrder === 'asc' ? comp : -comp;
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

  const hasActiveFilters = Boolean(
    searchTerm || paidFilter !== '' || allocFilter !== '' || activeFilter !== '' || sortBy !== 'name' || sortOrder !== 'asc'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setPaidFilter('');
    setAllocFilter('');
    setActiveFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => navigate('/time-off/requests')}
                className="app-btn app-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ← Back to Requests
              </button>
              <h1 className="app-page-title">Leave Types Configuration</h1>
              <span className="app-badge app-badge-neutral">{types.length} Types</span>
            </div>
            <p className="app-page-subtitle">
              Configure paid / unpaid leave types, approval workflows, and allocation rules
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="app-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              {editing ? 'Edit Leave Type' : 'Create New Leave Type'}
            </h3>
            {editing && (
              <span className="app-badge app-badge-info">Editing Mode</span>
            )}
          </div>

          {formError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="app-form-group">
              <label className="app-label">Type Name *</label>
              <input
                className="app-input"
                placeholder="e.g. Annual Vacation, Sick Leave"
                value={form.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="app-form-group">
              <label className="app-label">Unit *</label>
              <select
                className="app-select"
                value={form.unit ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as 'days' | 'hours' }))}
                required
              >
                <option value="">Select unit...</option>
                <option value="days">Days</option>
                <option value="hours">Hours</option>
              </select>
            </div>

            <div className="app-form-group">
              <label className="app-label">Approval Mode</label>
              <select
                className="app-select"
                value={form.approvalMode ?? 'time_off'}
                onChange={(e) => setForm((f) => ({ ...f, approvalMode: e.target.value }))}
              >
                <option value="no_validation">No Validation</option>
                <option value="time_off">Time Off Officer Approval</option>
                <option value="set_by_time_off_officer">Set by Officer</option>
              </select>
            </div>

            <div className="app-form-group">
              <label className="app-label">Color Code (Hex)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.color || '#3b82f6'}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ width: '38px', height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', padding: 0 }}
                />
                <input
                  className="app-input"
                  placeholder="#3b82f6"
                  value={form.color ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.allocationRequired ?? true}
                onChange={(e) => setForm((f) => ({ ...f, allocationRequired: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
              />
              Allocation Required
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isPaid ?? true}
                onChange={(e) => setForm((f) => ({ ...f, isPaid: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
              />
              Paid Leave
            </label>

            {editing && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
                />
                Active
              </label>
            )}
          </div>

          <div className="app-form-group" style={{ marginTop: '14px' }}>
            <label className="app-label">Notes / Guidelines</label>
            <input
              className="app-input"
              placeholder="Guidelines for employees taking this leave type..."
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            {editing && (
              <button
                type="button"
                className="app-btn app-btn-secondary"
                onClick={reset}
                disabled={saving}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="app-btn app-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Type' : 'Create Leave Type'}
            </button>
          </div>
        </form>

        {/* Toolbar */}
        <div className="app-filter-bar">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '300px' }}>
              <input
                className="app-input"
                placeholder="Search type name or notes..."
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
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value)}
              style={{ minWidth: '130px' }}
            >
              <option value="">All Paid Types</option>
              <option value="true">Paid Only</option>
              <option value="false">Unpaid Only</option>
            </select>

            <select
              className="app-select"
              value={allocFilter}
              onChange={(e) => setAllocFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">All Allocations</option>
              <option value="true">Allocation Required</option>
              <option value="false">No Limit</option>
            </select>

            <select
              className="app-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              style={{ minWidth: '130px' }}
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
                style={{ minWidth: '130px' }}
              >
                <option value="name">Name</option>
                <option value="unit">Unit</option>
                <option value="isPaid">Paid Status</option>
                <option value="allocationRequired">Allocation Req.</option>
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

        {/* Types Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading leave types...
          </div>
        ) : error ? (
          <div style={{ color: '#ef4444', padding: '16px' }}>{error}</div>
        ) : filteredAndSortedTypes.length === 0 ? (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0f172a' }}>No leave types match your filter</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>Try clearing the search or status filters.</p>
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
                    Leave Type {renderSortIndicator('name')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('unit')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Unit {renderSortIndicator('unit')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('allocationRequired')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Allocation Req. {renderSortIndicator('allocationRequired')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('isPaid')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Paid Status {renderSortIndicator('isPaid')}
                  </th>
                  <th>Approval Mode</th>
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
                {filteredAndSortedTypes.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: t.color || '#3b82f6',
                            display: 'inline-block',
                          }}
                        />
                        <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{t.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', color: '#475569' }}>{t.unit}</span>
                    </td>
                    <td>
                      <span className={`app-badge ${t.allocationRequired ? 'app-badge-info' : 'app-badge-neutral'}`}>
                        {t.allocationRequired ? 'Required' : 'No Limit'}
                      </span>
                    </td>
                    <td>
                      <span className={`app-badge ${t.isPaid ? 'app-badge-success' : 'app-badge-warning'}`}>
                        {t.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#475569' }}>
                      {t.approvalMode.replace(/_/g, ' ')}
                    </td>
                    <td>
                      <span className={`app-badge ${t.isActive ? 'app-badge-success' : 'app-badge-neutral'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="app-btn app-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
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
      </div>
    </div>
  );
}
