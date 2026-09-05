import React from 'react';
import { SalaryByDepartment } from '../types/dashboard.types';

interface SalaryByDeptChartProps {
  data: SalaryByDepartment[];
}

export const SalaryByDeptChart: React.FC<SalaryByDeptChartProps> = ({ data }) => {
  const maxSalary = Math.max(...data.map((d) => d.totalNet), 1);
  const totalPayroll = data.reduce((acc, curr) => acc + curr.totalNet, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Salary Cost by Department
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Total net distribution across organization units
          </p>
        </div>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            background: '#f1f5f9',
            padding: '4px 10px',
            borderRadius: '8px',
            color: '#334155',
          }}
        >
          {formatCurrency(totalPayroll)} total
        </span>
      </div>

      {data.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          No payroll data found for the selected filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {data.map((item, idx) => {
            const pct = Math.round((item.totalNet / maxSalary) * 100);
            const totalPct = totalPayroll > 0 ? ((item.totalNet / totalPayroll) * 100).toFixed(1) : '0';

            return (
              <div key={item.departmentId || `unassigned-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>
                      {item.department || 'Unassigned'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontWeight: 600,
                      }}
                    >
                      {item.headcount} {item.headcount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(item.totalNet)}</span>
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>({totalPct}%)</span>
                  </div>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    background: '#f1f5f9',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, #4338ca 100%)',
                      borderRadius: '6px',
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default SalaryByDeptChart;
