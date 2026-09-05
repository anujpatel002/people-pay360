import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../hooks/useEmployees';
import { Employee } from '../types/employee.types';
import EmployeeCard from '../components/EmployeeCard';
import EmployeeFiltersBar from '../components/EmployeeFilters';

export default function EmployeeKanbanPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const { data, total, page, limit, loading, error, filters, updateFilters, setPage } = useEmployees({ status: 'active' });

  const grouped = data.reduce<Record<string, Employee[]>>((acc, emp) => {
    const dept = emp.departmentName ?? emp.departmentId ?? 'Unassigned';
    (acc[dept] ??= []).push(emp);
    return acc;
  }, {});

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Employees</h2>
        <button
          onClick={() => navigate('/employees/new')}
          style={{ padding: '8px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}
        >
          + NEW
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <EmployeeFiltersBar filters={filters} onChange={updateFilters} />
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {(['kanban', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                background: view === v ? '#4f46e5' : '#f3f4f6',
                color: view === v ? '#fff' : '#374151',
                border: '1px solid #e5e7eb',
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ color: '#6b7280' }}>Loading…</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {!loading && !error && data.length === 0 && (
        <p style={{ color: '#6b7280', textAlign: 'center', marginTop: 48 }}>No employees found.</p>
      )}

      {!loading && view === 'kanban' && (
        <div>
          {Object.entries(grouped).map(([dept, employees]) => (
            <div key={dept} style={{ marginBottom: 28 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                {dept}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {employees.map((emp) => <EmployeeCard key={emp.id} employee={emp} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && view === 'list' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              {['Employee', 'Emp #', 'Work Email', 'Job Position', 'Department', 'Type', 'Status', 'Hire Date'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((emp) => (
              <tr
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                style={{ cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
              >
                <td style={{ padding: '8px 12px' }}>{emp.firstName} {emp.lastName}</td>
                <td style={{ padding: '8px 12px', color: '#6b7280' }}>{emp.employeeNumber ?? '—'}</td>
                <td style={{ padding: '8px 12px' }}>{emp.workEmail}</td>
                <td style={{ padding: '8px 12px' }}>{emp.jobPositionName ?? '—'}</td>
                <td style={{ padding: '8px 12px' }}>{emp.departmentName ?? '—'}</td>
                <td style={{ padding: '8px 12px' }}>{emp.employmentType.replace('_', '-')}</td>
                <td style={{ padding: '8px 12px' }}>{emp.status}</td>
                <td style={{ padding: '8px 12px' }}>{emp.hireDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          <button onClick={() => setPage(page - 1)} disabled={page <= 1} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}>‹</button>
          <span style={{ padding: '6px 12px', fontSize: 13 }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}>›</button>
        </div>
      )}
    </div>
  );
}
