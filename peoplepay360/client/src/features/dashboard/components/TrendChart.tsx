import React from 'react';
import { MonthlySalaryTrend } from '../types/dashboard.types';

interface TrendChartProps {
  data: MonthlySalaryTrend[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.totalNet), 1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatPeriod = (periodStr: string) => {
    try {
      const [y, m] = periodStr.split('-');
      const date = new Date(Number(y), Number(m) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } catch {
      return periodStr;
    }
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
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Monthly Payroll Trend
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Validated & paid salary net progression over recent cycles
        </p>
      </div>

      {data.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          No historical payroll cycles found.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            height: '180px',
            paddingTop: '20px',
            borderBottom: '1px solid #e2e8f0',
            gap: '12px',
          }}
        >
          {data.map((item, idx) => {
            const heightPct = Math.max(12, Math.round((item.totalNet / maxVal) * 100));

            return (
              <div
                key={item.period || idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatCurrency(item.totalNet)}
                </div>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '48px',
                    height: `${heightPct}%`,
                    background:
                      idx === data.length - 1
                        ? 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                        : 'linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%)',
                    borderRadius: '8px 8px 0 0',
                    transition: 'height 0.5s ease',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                  }}
                  title={`${item.period}: ${formatCurrency(item.totalNet)}`}
                />
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                  }}
                >
                  {formatPeriod(item.period)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default TrendChart;
