import React from 'react';
import { DepartmentOverview as DeptData } from '../types/dashboard.types';

interface DepartmentOverviewProps {
  data: DeptData[];
}

export const DepartmentOverview: React.FC<DepartmentOverviewProps> = ({ data }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalHeadcount = data.reduce((acc, curr) => acc + curr.headcount, 0);
  const totalSalary = data.reduce((acc, curr) => acc + curr.monthlySalary, 0);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Department Overview
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Headcount distribution and monthly payroll commitments by team
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              background: '#f1f5f9',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#334155',
            }}
          >
            {totalHeadcount} Total Headcount
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              background: '#e0e7ff',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#4338ca',
            }}
          >
            {formatCurrency(totalSalary)} Monthly
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          No department data available.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Department</th>
                <th style={{ padding: '12px 16px' }}>Headcount</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Monthly Net Salary</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Avg Net / Employee</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const avg = row.headcount > 0 ? Math.round(row.monthlySalary / row.headcount) : 0;

                return (
                  <tr
                    key={row.departmentId || `dept-row-${idx}`}
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: row.department === 'Unassigned' ? '#94a3b8' : '#6366f1',
                          }}
                        />
                        {row.department || 'Unassigned'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>
                      <span
                        style={{
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {row.headcount} {row.headcount === 1 ? 'employee' : 'employees'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {formatCurrency(row.monthlySalary)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b', fontSize: '13px' }}>
                      {row.headcount > 0 ? formatCurrency(avg) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default DepartmentOverview;
