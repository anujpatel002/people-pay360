import React from 'react';
import { DepartmentOverview as DeptData } from '../types/dashboard.types';

interface DepartmentOverviewProps {
  data: DeptData[];
  canViewPayroll?: boolean;
}

export const DepartmentOverview: React.FC<DepartmentOverviewProps> = ({ data, canViewPayroll = true }) => {
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
    <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
            Department Overview
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--dash-text-muted)' }}>
            {canViewPayroll
              ? 'Headcount distribution and monthly payroll commitment by business team'
              : 'Headcount distribution by business team'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              background: '#f1f5f9',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#334155',
              border: '1px solid #e2e8f0',
            }}
          >
            {totalHeadcount} Total Headcount
          </span>
          {canViewPayroll ? (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                background: 'var(--dash-primary-light)',
                padding: '6px 12px',
                borderRadius: '8px',
                color: 'var(--dash-primary)',
                border: '1px solid var(--dash-primary-border)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatCurrency(totalSalary)} Monthly
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
              Payroll restricted
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div
          style={{
            padding: '36px 16px',
            textAlign: 'center',
            color: 'var(--dash-text-subtle)',
            fontSize: '13.5px',
          }}
        >
          No department data available.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Department</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Headcount</th>
                {canViewPayroll && <>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>Monthly Net Salary</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>Avg Net / Employee</th>
                </>}
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
                    <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: '#eef2ff',
                            color: '#4f46e5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          {(row.department || 'UN')[0]}
                        </div>
                        <span>{row.department || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px', color: '#334155' }}>
                      <span
                        style={{
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 650,
                          fontSize: '12px',
                        }}
                      >
                        {row.headcount} members
                      </span>
                    </td>

                    {canViewPayroll && <>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(row.monthlySalary)}
                      </td>

                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(avg)}
                      </td>
                    </>}
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
