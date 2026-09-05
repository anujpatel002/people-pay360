import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  badge?: string;
  badgeType?: 'positive' | 'neutral' | 'warning';
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'purple';
}

const colorMap = {
  primary: {
    bg: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
    iconBg: 'rgba(255, 255, 255, 0.2)',
    text: '#ffffff',
  },
  success: {
    bg: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
    iconBg: 'rgba(255, 255, 255, 0.2)',
    text: '#ffffff',
  },
  warning: {
    bg: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
    iconBg: 'rgba(255, 255, 255, 0.2)',
    text: '#ffffff',
  },
  info: {
    bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    iconBg: 'rgba(255, 255, 255, 0.2)',
    text: '#ffffff',
  },
  purple: {
    bg: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    iconBg: 'rgba(255, 255, 255, 0.2)',
    text: '#ffffff',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeType = 'neutral',
  variant = 'primary',
}) => {
  const theme = colorMap[variant] || colorMap.primary;

  return (
    <div
      style={{
        background: theme.bg,
        borderRadius: '16px',
        padding: '24px',
        color: theme.text,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '140px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.02em' }}>
            {value}
          </div>
        </div>
        {icon && (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: theme.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
        {subtitle && (
          <span style={{ fontSize: '13px', opacity: 0.85 }}>{subtitle}</span>
        )}
        {badge && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '20px',
              background: badgeType === 'positive' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              marginLeft: 'auto',
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
export default KpiCard;
