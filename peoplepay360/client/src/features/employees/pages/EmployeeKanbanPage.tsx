import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { Employee } from '../types/employee.types';
import EmployeeCard from '../components/EmployeeCard';
import EmployeeFiltersBar from '../components/EmployeeFilters';
import EmployeeAvatar from '../components/EmployeeAvatar';

export default function EmployeeKanbanPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const { data, total, page, limit, loading, error, filters, updateFilters, setPage } =
    useEmployees({ status: 'active' });

  const grouped = data.reduce<Record<string, Employee[]>>((acc, emp) => {
    const dept = emp.departmentName ?? emp.departmentId ?? 'Unassigned Department';
    (acc[dept] ??= []).push(emp);
    return acc;
  }, {});

  const totalPages = Math.ceil(total / limit) || 1;

  // Stat metrics
  const activeCount = data.filter((e) => e.status === 'active').length;
  const fullTimeCount = data.filter((e) => e.employmentType === 'full_time').length;
  const contractorCount = data.filter((e) => e.employmentType === 'contractor').length;
  const departmentCount = Object.keys(grouped).length;

  function handleExportCSV() {
    if (!data.length) {
      alert('No employees available to export.');
      return;
    }
    const headers = [
      'Employee Number',
      'Full Name',
      'Work Email',
      'Department',
      'Job Position',
      'Employment Type',
      'Status',
      'Company',
      'Hire Date',
      'Location',
    ];

    const rows = data.map((e) => [
      `"${e.employeeNumber || ''}"`,
      `"${e.firstName} ${e.lastName}"`,
      `"${e.workEmail || ''}"`,
      `"${e.departmentName || e.departmentId || ''}"`,
      `"${e.jobTitle || ''}"`,
      `"${e.employmentType || ''}"`,
      `"${e.status || ''}"`,
      `"${e.companyName || ''}"`,
      `"${e.hireDate ? new Date(e.hireDate).toISOString().split('T')[0] : ''}"`,
      `"${e.location || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-page">
      <div className="app-page-container">
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="app-page-title">Employees Directory</h1>
              <span className="app-badge app-badge-neutral">{total} Total</span>
            </div>
            <p className="app-page-subtitle">
              Organization roster, team members, department structures, and employment assignments
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              className="app-btn app-btn-secondary"
              title="Export current filtered roster to CSV"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/employees/new')}
              className="app-btn app-btn-primary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add New Employee</span>
            </button>
          </div>
        </div>

        {/* Overview Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <div className="app-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 650, color: '#64748b', textTransform: 'uppercase' }}>
              Total Personnel
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {total}
            </div>
          </div>

          <div className="app-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 650, color: '#64748b', textTransform: 'uppercase' }}>
              Active Staff
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
              {activeCount}
            </div>
          </div>

          <div className="app-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 650, color: '#64748b', textTransform: 'uppercase' }}>
              Full-Time Regular
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
              {fullTimeCount}
            </div>
          </div>

          <div className="app-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 650, color: '#64748b', textTransform: 'uppercase' }}>
              Contractors / Part-Time
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
              {contractorCount}
            </div>
          </div>

          <div className="app-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 650, color: '#64748b', textTransform: 'uppercase' }}>
              Departments Active
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {departmentCount}
            </div>
          </div>
        </div>

        {/* Filter and View Switcher Bar */}
        <div className="app-filter-bar">
          <EmployeeFiltersBar
            filters={filters}
            onChange={updateFilters}
            onReset={() => updateFilters({ search: undefined, status: undefined, employmentType: undefined, sortBy: 'last_name', sortOrder: 'asc' })}
          />

          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setView('kanban')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: view === 'kanban' ? '#ffffff' : 'transparent',
                color: view === 'kanban' ? '#4f46e5' : '#64748b',
                boxShadow: view === 'kanban' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Cards View</span>
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: view === 'list' ? '#ffffff' : 'transparent',
                color: view === 'list' ? '#4f46e5' : '#64748b',
                boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>Table View</span>
            </button>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading employees directory...
          </div>
        )}

        {error && (
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
            {error}
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="app-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>No employees found</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px' }}>
              Try adjusting your search query or filter parameters.
            </p>
            <button
              type="button"
              onClick={() => updateFilters({ search: undefined, status: undefined, employmentType: undefined, sortBy: 'last_name', sortOrder: 'asc' })}
              className="app-btn app-btn-secondary"
              style={{ marginRight: '8px' }}
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => navigate('/employees/new')}
              className="app-btn app-btn-primary"
            >
              + Add New Employee
            </button>
          </div>
        )}

        {/* Kanban / Cards View */}
        {!loading && view === 'kanban' && data.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {Object.entries(grouped).map(([dept, employees]) => (
              <div key={dept}>
                {/* Department Section Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '14px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>🏢</span>
                  <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {dept}
                  </h2>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#475569',
                      background: '#e2e8f0',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {employees.length} member{employees.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {employees.map((emp) => (
                    <EmployeeCard key={emp.id} employee={emp} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {!loading && view === 'list' && data.length > 0 && (
          <div className="app-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'last_name' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'last_name', sortOrder: nextOrder });
                    }}
                  >
                    Employee Profile {filters.sortBy === 'last_name' ? (filters.sortOrder === 'desc' ? '▼' : '▲') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'employee_number' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'employee_number', sortOrder: nextOrder });
                    }}
                  >
                    Emp # {filters.sortBy === 'employee_number' ? (filters.sortOrder === 'desc' ? '▼' : '▲') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th>Job Position</th>
                  <th>Department</th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'work_email' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'work_email', sortOrder: nextOrder });
                    }}
                  >
                    Work Email {filters.sortBy === 'work_email' ? (filters.sortOrder === 'desc' ? '▼' : '▲') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th>Phone</th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'employment_type' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'employment_type', sortOrder: nextOrder });
                    }}
                  >
                    Type {filters.sortBy === 'employment_type' ? (filters.sortOrder === 'desc' ? '▼' : '▲') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => {
                      const nextOrder = filters.sortBy === 'status' && filters.sortOrder === 'asc' ? 'desc' : 'asc';
                      updateFilters({ sortBy: 'status', sortOrder: nextOrder });
                    }}
                  >
                    Status {filters.sortBy === 'status' ? (filters.sortOrder === 'desc' ? '▼' : '▲') : <span style={{ opacity: 0.25 }}>↕</span>}
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                      >
                        <EmployeeAvatar
                          avatarUrl={emp.avatarUrl}
                          firstName={emp.firstName}
                          lastName={emp.lastName}
                          size={32}
                        />
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '13.5px', display: 'block' }}>
                            {emp.firstName} {emp.lastName}
                          </strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>
                        {emp.employeeNumber ? `#${emp.employeeNumber}` : '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#4338ca',
                          background: '#e0e7ff',
                          padding: '2px 7px',
                          borderRadius: '5px',
                        }}
                      >
                        {emp.jobPositionName || emp.jobTitle || '—'}
                      </span>
                    </td>
                    <td style={{ color: '#475569', fontWeight: 600, fontSize: '13px' }}>
                      {emp.departmentName ?? 'Unassigned'}
                    </td>
                    <td style={{ color: '#334155', fontSize: '12.5px' }}>
                      <a
                        href={`mailto:${emp.workEmail}`}
                        style={{ color: '#2563eb', textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {emp.workEmail}
                      </a>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '12.5px' }}>
                      {emp.phone || '—'}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 650,
                          background: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '5px',
                          color: '#475569',
                          textTransform: 'capitalize',
                        }}
                      >
                        {emp.employmentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`app-badge ${
                          emp.status === 'active' ? 'app-badge-success' : 'app-badge-neutral'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="app-btn app-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        Profile →
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
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'center', alignItems: 'center' }}>
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
