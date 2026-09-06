import React from 'react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  badge?: string;
  badgeType?: 'positive' | 'neutral' | 'warning';
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'purple';
}

const themeConfigs = {
  primary: {
    bg: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
    iconBg: 'rgba(255, 255, 255, 0.18)',
    glow: 'rgba(79, 70, 229, 0.25)',
    textColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.82)',
  },
  success: {
    bg: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
    iconBg: 'rgba(255, 255, 255, 0.18)',
    glow: 'rgba(5, 150, 105, 0.25)',
    textColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.82)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
    iconBg: 'rgba(255, 255, 255, 0.18)',
    glow: 'rgba(217, 119, 6, 0.25)',
    textColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.82)',
  },
  info: {
    bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    iconBg: 'rgba(255, 255, 255, 0.18)',
    glow: 'rgba(2, 132, 199, 0.25)',
    textColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.82)',
  },
  purple: {
    bg: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    iconBg: 'rgba(255, 255, 255, 0.18)',
    glow: 'rgba(124, 58, 237, 0.25)',
    textColor: '#ffffff',
    subColor: 'rgba(255, 255, 255, 0.82)',
  },
};

// Render crisp SVGs for key metric icons
function renderIcon(iconKey?: string) {
  switch (iconKey) {
    case '💰':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
          <path d="M12 6v2m0 8v2" />
        </svg>
      );
    case '📄':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case '⚖️':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" />
          <path d="M6 7l6-3 6 3" />
          <path d="M4 14l4-7 4 7c0 2-2 3-4 3s-4-1-4-3z" />
          <path d="M12 14l4-7 4 7c0 2-2 3-4 3s-4-1-4-3z" />
        </svg>
      );
    case '🌴':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 8c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z" />
          <path d="M13 8c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z" />
          <path d="M13 8c3.3 0 6 2.7 6 6 0-3.3-2.7-6-6-6Z" />
          <path d="M13 8c-3.3 0-6 2.7-6 6 0-3.3 2.7-6 6-6Z" />
          <path d="M12 8v14" />
        </svg>
      );
    case '⏱️':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    default:
      return iconKey ? <span>{iconKey}</span> : null;
  }
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeType = 'neutral',
  variant = 'primary',
}) => {
  const theme = themeConfigs[variant] || themeConfigs.primary;

  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'positive':
        return { bg: 'rgba(255, 255, 255, 0.25)', color: '#ffffff', border: 'rgba(255, 255, 255, 0.4)' };
      case 'warning':
        return { bg: 'rgba(254, 240, 138, 0.3)', color: '#ffffff', border: 'rgba(254, 240, 138, 0.5)' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: 'rgba(255, 255, 255, 0.25)' };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <div
      style={{
        background: theme.bg,
        borderRadius: '18px',
        padding: '22px 24px',
        color: theme.textColor,
        boxShadow: `0 10px 24px -4px ${theme.glow}, 0 4px 8px -2px rgba(15, 23, 42, 0.08)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '148px',
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 18px 30px -4px ${theme.glow}, 0 8px 12px -2px rgba(15, 23, 42, 0.12)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 10px 24px -4px ${theme.glow}, 0 4px 8px -2px rgba(15, 23, 42, 0.08)`;
      }}
    >
      {/* Subtle Background Glow Circle */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: theme.subColor,
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: '26px',
              fontWeight: 800,
              marginTop: '8px',
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
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
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.3)',
            }}
          >
            {renderIcon(icon)}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: '12px', color: theme.subColor, fontWeight: 500 }}>
          {subtitle || 'Live operational metric'}
        </span>

        {badge && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              background: badgeStyle.bg,
              color: badgeStyle.color,
              border: `1px solid ${badgeStyle.border}`,
              letterSpacing: '0.02em',
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
