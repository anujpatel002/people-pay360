import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllocations, useTimeOffTypes } from '../hooks/useTimeOff';
import { getContractLookups } from '@/features/contracts/services/contracts.service';
import { EmployeeLookup } from '@/features/contracts/types/contract.types';

export default function AllocationListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('remainingDays');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [employees, setEmployees] = useState<EmployeeLookup[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<EmployeeLookup | null>(null);

  const { data: rawData, total, loading, error, create } = useAllocations(filters);
  const { types } = useTimeOffTypes();

  useEffect(() => {
    getContractLookups()
      .then((data) => setEmployees(data.employees || []))
      .catch(() => {});
  }, []);

  const handleSelectEmployee = (emp: EmployeeLookup | null) => {
    setSelectedEmp(emp);
    if (emp) {
      setForm((prev) => ({ ...prev, employeeId: emp.id }));
      setEmpSearch('');
    } else {
      setForm((prev) => ({ ...prev, employeeId: '' }));
    }
  };

  const handleYearChange = (yr: string | number) => {
    const y = Number(yr) || new Date().getFullYear();
    setForm((prev) => ({
      ...prev,
      year: yr,
      validityStart: `${y}-01-01`,
      validityEnd: `${y}-12-31`,
    }));
  };

  const openCreateForm = () => {
    const currentYear = new Date().getFullYear();
    setForm({
      year: currentYear,
      validityStart: `${currentYear}-01-01`,
      validityEnd: `${currentYear}-12-31`,
      totalDays: 20,
    });
    setFormError('');
    setShowCreate(true);
  };

  const handleFilter = (key: string, val: string) =>
    setFilters((f) =>
      val
        ? { ...f, [key]: val }
        : Object.fromEntries(Object.entries(f).filter(([k]) => k !== key))
    );

  // Client-side search and sorting on allocations
  const filteredAndSortedData = [...rawData]
    .filter((a) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const emp = (a.employeeName || a.employeeId || '').toLowerCase();
      const type = (a.typeName || '').toLowerCase();
      return emp.includes(term) || type.includes(term);
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'remainingDays') {
        comp = Number(a.remainingDays) - Number(b.remainingDays);
      } else if (sortBy === 'totalDays') {
        comp = Number(a.totalDays) - Number(b.totalDays);
      } else if (sortBy === 'usedDays') {
        comp = Number(a.usedDays) - Number(b.usedDays);
      } else if (sortBy === 'year') {
        comp = Number(a.year) - Number(b.year);
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
    searchTerm || filters.year || filters.typeId || filters.status || sortBy !== 'remainingDays' || sortOrder !== 'desc'
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({});
    setSortBy('remainingDays');
    setSortOrder('desc');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.employeeId ||
      !form.typeId ||
      !form.year ||
      !form.totalDays ||
      !form.validityStart ||
      !form.validityEnd
    ) {
      setFormError('All fields marked with * are required');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await create({
        ...form,
        year: Number(form.year),
        totalDays: Number(form.totalDays),
      });
      setForm({});
      setSelectedEmp(null);
      setShowCreate(false);
    } catch (e: any) {
      setFormError(e?.response?.data?.error ?? 'Failed to create allocation');
    } finally {
      setSaving(false);
    }
  };

  const STATUS_CLASSES: Record<string, string> = {
    Approved: 'app-badge-success',
    Draft: 'app-badge-neutral',
    Confirmed: 'app-badge-info',
    Refused: 'app-badge-danger',
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
              <h1 className="app-page-title">Leave Allocations</h1>
              <span className="app-badge app-badge-neutral">{total} Total</span>
            </div>
            <p className="app-page-subtitle">
              Grant yearly leave balances and days quotas per employee and leave type
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showCreate) {
                setShowCreate(false);
              } else {
                openCreateForm();
              }
            }}
            className="app-btn app-btn-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{showCreate ? 'Hide Form' : 'New Allocation'}</span>
          </button>
        </div>

        {/* Create Form Drawer/Card */}
        {showCreate && (
          <form onSubmit={handleSubmit} className="app-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Grant Leave Allocation
              </h3>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                Allocate days balance for statutory or annual leave
              </span>
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

            {/* Employee Search & Quick-Select Section */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <label className="app-label" style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔍</span> Find & Select Employee *
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {/* Search Typeahead */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="app-input"
                    placeholder="Type employee name (e.g. Sneha Patel, Priya)..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                  />
                  {empSearch.trim().length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 40,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        marginTop: '4px',
                      }}
                    >
                      {employees
                        .filter((e) => {
                          const q = empSearch.toLowerCase();
                          const name = (e.name || `${e.firstName || ''} ${e.lastName || ''}`).toLowerCase();
                          const num = (e.employeeNumber || '').toLowerCase();
                          const dept = (e.departmentName || '').toLowerCase();
                          return name.includes(q) || num.includes(q) || dept.includes(q);
                        })
                        .slice(0, 10)
                        .map((e) => (
                          <div
                            key={e.id}
                            onClick={() => handleSelectEmployee(e)}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#ffffff',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(ev) => (ev.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={(ev) => (ev.currentTarget.style.background = '#ffffff')}
                          >
                            <div>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                                {e.name || `${e.firstName || ''} ${e.lastName || ''}`}
                              </strong>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                {e.departmentName || 'General'} • {e.jobTitle || 'Staff'}
                              </div>
                            </div>
                            {e.employeeNumber && (
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                #{e.employeeNumber}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Dropdown Select */}
                <select
                  className="app-select"
                  value={selectedEmp?.id || form.employeeId || ''}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.id === e.target.value);
                    handleSelectEmployee(emp || null);
                  }}
                >
                  <option value="">-- Or choose from employee roster --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name || `${e.firstName || ''} ${e.lastName || ''}`} {e.employeeNumber ? `(${e.employeeNumber})` : ''} - {e.departmentName || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Employee Badge/Card */}
              {selectedEmp && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>👤</span>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#15803d' }}>
                        {selectedEmp.name || `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#166534', marginLeft: '8px' }}>
                        {selectedEmp.employeeNumber ? `Badge: #${selectedEmp.employeeNumber}` : ''} • {selectedEmp.departmentName || 'General'} • {selectedEmp.jobTitle || 'Staff'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectEmployee(null)}
                    className="app-btn app-btn-subtle"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#dc2626' }}
                  >
                    Change Employee ✕
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div className="app-form-group">
                <label className="app-label">Employee ID / Code *</label>
                <input
                  className="app-input"
                  placeholder="e.g. EMP-10151 or UUID"
                  value={form.employeeId ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
                  required
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Leave Type *</label>
                <select
                  className="app-select"
                  value={form.typeId ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, typeId: e.target.value }))}
                  required
                >
                  <option value="">Select type...</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="app-form-group">
                <label className="app-label">Year *</label>
                <input
                  type="number"
                  className="app-input"
                  placeholder="2026"
                  value={form.year ?? new Date().getFullYear()}
                  onChange={(e) => handleYearChange(e.target.value)}
                  required
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Total Days Allocation *</label>
                <input
                  type="number"
                  step="0.5"
                  className="app-input"
                  placeholder="e.g. 20"
                  value={form.totalDays ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, totalDays: e.target.value }))}
                  required
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Validity Start *</label>
                <input
                  type="date"
                  className="app-input"
                  value={form.validityStart ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, validityStart: e.target.value }))}
                  required
                />
              </div>

              <div className="app-form-group">
                <label className="app-label">Validity End *</label>
                <input
                  type="date"
                  className="app-input"
                  value={form.validityEnd ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, validityEnd: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                className="app-btn app-btn-secondary"
                onClick={() => setShowCreate(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="app-btn app-btn-primary" disabled={saving}>
                {saving ? 'Granting...' : 'Grant Allocation'}
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="app-filter-bar">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '300px' }}>
              <input
                className="app-input"
                placeholder="Search employee or leave type..."
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

            <input
              type="number"
              className="app-input"
              placeholder="Year (e.g. 2026)"
              value={filters.year ?? ''}
              onChange={(e) => handleFilter('year', e.target.value)}
              style={{ width: '130px' }}
            />

            <select
              className="app-select"
              value={filters.typeId ?? ''}
              onChange={(e) => handleFilter('typeId', e.target.value)}
              style={{ minWidth: '160px' }}
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
              {['Approved', 'Confirmed', 'Draft', 'Refused'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
                <option value="remainingDays">Remaining Days</option>
                <option value="totalDays">Total Granted</option>
                <option value="usedDays">Used Days</option>
                <option value="year">Year</option>
                <option value="employeeName">Employee</option>
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

        {/* Table */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading allocations...
          </div>
        ) : filteredAndSortedData.length === 0 ? (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>No allocations found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
              {hasActiveFilters ? 'Try adjusting your search or filter parameters.' : 'Grant leave days to employees for the current calendar or fiscal year.'}
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
                onClick={() => setShowCreate(true)}
                className="app-btn app-btn-primary"
              >
                + Create First Allocation
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
                    onClick={() => handleHeaderSort('year')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Year {renderSortIndicator('year')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('totalDays')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Total Granted {renderSortIndicator('totalDays')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('usedDays')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Used {renderSortIndicator('usedDays')}
                  </th>
                  <th
                    onClick={() => handleHeaderSort('remainingDays')}
                    style={{ textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Remaining {renderSortIndicator('remainingDays')}
                  </th>
                  <th>Validity Period</th>
                  <th
                    onClick={() => handleHeaderSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {renderSortIndicator('status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((a) => {
                  const isLow = a.remainingDays <= 2;
                  return (
                    <tr key={a.id}>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                          {a.employeeName || 'Staff Member'}
                        </strong>
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
                          {a.typeName}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#475569' }}>{a.year}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ color: '#0f172a' }}>{a.totalDays}d</strong>
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>
                        {a.usedDays}d
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '12.5px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: isLow ? '#fef2f2' : '#ecfdf5',
                            color: isLow ? '#dc2626' : '#166534',
                            border: isLow ? '1px solid #fecaca' : '1px solid #a7f3d0',
                          }}
                        >
                          {a.remainingDays}d left
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#475569' }}>
                        {a.validityStart} <span style={{ color: '#94a3b8' }}>→</span> {a.validityEnd}
                      </td>
                      <td>
                        <span className={`app-badge ${STATUS_CLASSES[a.status] ?? 'app-badge-neutral'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
