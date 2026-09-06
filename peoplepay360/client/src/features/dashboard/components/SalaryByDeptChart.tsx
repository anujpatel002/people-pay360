import React from 'react';
import { SalaryByDepartment } from '../types/dashboard.types';

interface SalaryByDeptChartProps {
  data: SalaryByDepartment[];
}

const barGradients = [
  'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
  'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
  'linear-gradient(90deg, #059669 0%, #34d399 100%)',
  'linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)',
  'linear-gradient(90deg, #d97706 0%, #fbbf24 100%)',
  'linear-gradient(90deg, #e11d48 0%, #fb7185 100%)',
];

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
    <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Salary Cost by Department
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--dash-text-muted)' }}>
            Net compensation distribution across business units
          </p>
        </div>

        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            background: 'var(--dash-primary-light)',
            color: 'var(--dash-primary)',
            padding: '5px 12px',
            borderRadius: '10px',
            border: '1px solid var(--dash-primary-border)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(totalPayroll)} total
        </div>
      </div>

      {/* Content */}
      {data.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 16px',
            color: 'var(--dash-text-subtle)',
            fontSize: '13.5px',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '10px', opacity: 0.7 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          No payroll records in selected scope
        </div>
      ) : (
        <div className="dash-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
          {data.map((item, idx) => {
            const pctOfMax = Math.max(8, Math.round((item.totalNet / maxSalary) * 100));
            const pctOfTotal = totalPayroll > 0 ? ((item.totalNet / totalPayroll) * 100).toFixed(1) : '0';
            const gradient = barGradients[idx % barGradients.length];

            return (
              <div
                key={item.departmentId || `dept-${idx}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {/* Department Info & Numbers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#64748b',
                        width: '20px',
                        textAlign: 'center',
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>
                      {item.department || 'Unassigned'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {item.headcount} {item.headcount === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(item.totalNet)}
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: 'var(--dash-text-muted)',
                        background: '#f8fafc',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {pctOfTotal}%
                    </span>
                  </div>
                </div>

                {/* Gradient Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: '#f1f5f9',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${pctOfMax}%`,
                      height: '100%',
                      background: gradient,
                      borderRadius: '9999px',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
