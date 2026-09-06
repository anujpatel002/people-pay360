import React, { useState } from 'react';
import { MonthlySalaryTrend } from '../types/dashboard.types';

interface TrendChartProps {
  data: MonthlySalaryTrend[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return periodStr;
    }
  };

  // Calculate MoM growth for the last item compared to previous
  const getGrowthRate = () => {
    if (data.length < 2) return null;
    const latest = data[data.length - 1].totalNet;
    const previous = data[data.length - 2].totalNet;
    if (previous === 0) return null;
    const diff = ((latest - previous) / previous) * 100;
    return diff.toFixed(1);
  };

  const growth = getGrowthRate();

  return (
    <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
            Monthly Payroll Trend
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--dash-text-muted)' }}>
            Net compensation progression across pay cycles
          </p>
        </div>

        {growth && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '8px',
              background: Number(growth) >= 0 ? '#ecfdf5' : '#fef2f2',
              color: Number(growth) >= 0 ? '#047857' : '#b91c1c',
              border: `1px solid ${Number(growth) >= 0 ? '#a7f3d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {Number(growth) >= 0 ? '↗ +' : '↘ '}
            {growth}% MoM
          </span>
        )}
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
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          No historical payroll trend data found
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingTop: '10px' }}>
          {/* Columns Display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              height: '175px',
              gap: '16px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '8px',
            }}
          >
            {data.map((item, idx) => {
              const heightPct = Math.max(14, Math.round((item.totalNet / maxVal) * 100));
              const isHovered = hoveredIdx === idx;
              const isLatest = idx === data.length - 1;

              return (
                <div
                  key={item.period || idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {/* Tooltip / Amount Tag */}
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isHovered || isLatest ? '#0f172a' : '#64748b',
                      marginBottom: '8px',
                      fontVariantNumeric: 'tabular-nums',
                      background: isHovered ? '#f1f5f9' : 'transparent',
                      padding: isHovered ? '2px 6px' : '0',
                      borderRadius: '6px',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatCurrency(item.totalNet)}
                  </div>

                  {/* Visual Bar */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '46px',
                      height: `${heightPct}%`,
                      background: isLatest
                        ? 'linear-gradient(180deg, #4f46e5 0%, #3730a3 100%)'
                        : isHovered
                          ? 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)'
                          : 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
                      borderRadius: '8px 8px 3px 3px',
                      boxShadow: isLatest
                        ? '0 4px 12px rgba(79, 70, 229, 0.3)'
                        : isHovered
                          ? '0 4px 10px rgba(99, 102, 241, 0.2)'
                          : 'none',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              paddingTop: '10px',
              gap: '16px',
            }}
          >
            {data.map((item, idx) => (
              <div
                key={`label-${item.period || idx}`}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '11.5px',
                  fontWeight: hoveredIdx === idx || idx === data.length - 1 ? 700 : 550,
                  color: hoveredIdx === idx || idx === data.length - 1 ? '#0f172a' : '#64748b',
                  letterSpacing: '-0.01em',
                }}
              >
                {formatPeriod(item.period)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendChart;
