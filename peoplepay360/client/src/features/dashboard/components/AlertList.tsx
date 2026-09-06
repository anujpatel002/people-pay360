import React, { useState } from 'react';
import { DashboardAlertSummary, DashboardAlert } from '../types/dashboard.types';
import { dashboardService } from '../services/dashboard.service';
import AlertDetail from './AlertDetail';

interface AlertListProps {
  alerts: DashboardAlertSummary[];
  companyId?: string;
  onRefreshNeeded?: () => void;
}

export const AlertList: React.FC<AlertListProps> = ({ alerts, companyId, onRefreshNeeded }) => {
  const [selectedAlert, setSelectedAlert] = useState<DashboardAlert | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const handleAlertClick = async (summary: DashboardAlertSummary) => {
    setLoadingDetail(true);
    try {
      const detailedList = await dashboardService.getAlerts(companyId);
      const matched = detailedList.find((a) => a.type === summary.type && a.status === summary.status);
      if (matched) {
        setSelectedAlert(matched);
      } else if (detailedList.length > 0) {
        setSelectedAlert(detailedList[0]);
      }
    } catch (err) {
      console.error('Failed to load alert detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#991b1b',
          badgeBg: '#fee2e2',
          dot: '#ef4444',
        };
      case 'WARNING':
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          text: '#92400e',
          badgeBg: '#fef3c7',
          dot: '#f59e0b',
        };
      default:
        return {
          bg: '#f0f9ff',
          border: '#bae6fd',
          text: '#0369a1',
          badgeBg: '#e0f2fe',
          dot: '#0ea5e9',
        };
    }
  };

  const totalActive = alerts.reduce((acc, curr) => acc + curr.count, 0);

  const formatAlertTitle = (type: string) => {
    switch (type) {
      case 'MISSING_BANK_DETAILS':
        return 'Missing Bank Details';
      case 'DUPLICATE_PAYSLIP':
        return 'Duplicate Payslip Detected';
      case 'UNVALIDATED_PAYRUN':
        return 'Unvalidated Payrun';
      case 'EXPIRING_CONTRACT':
        return 'Expiring Contract';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  return (
    <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
            Operational Alerts
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--dash-text-muted)' }}>
            Exceptions and required actions requiring attention
          </p>
        </div>

        {totalActive > 0 ? (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                animation: 'dashPulse 1.8s infinite',
              }}
            />
            {totalActive} active
          </span>
        ) : (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
            }}
          >
            ✓ All clear
          </span>
        )}
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
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
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" style={{ marginBottom: '10px' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          No pending anomalies or blocking issues detected
        </div>
      ) : (
        <div className="dash-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
          {alerts.map((item) => {
            const style = getSeverityStyle(item.severity);

            return (
              <div
                key={`${item.type}-${item.status}`}
                onClick={() => handleAlertClick(item)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(3px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: style.dot,
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 750, fontSize: '13.5px', color: '#0f172a' }}>
                        {formatAlertTitle(item.type)}
                      </span>
                      {item.blocking && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '5px',
                            background: '#ef4444',
                            color: '#ffffff',
                            letterSpacing: '0.04em',
                          }}
                        >
                          BLOCKING
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: style.text, fontWeight: 500 }}>
                      {item.message}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: style.badgeBg,
                      color: style.text,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {item.count}
                  </span>

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer Modal */}
      {selectedAlert && (
        <AlertDetail
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onStatusChanged={() => {
            setSelectedAlert(null);
            onRefreshNeeded?.();
          }}
        />
      )}

      {loadingDetail && (
        <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: 'var(--dash-text-muted)' }}>
          Loading alert details...
        </div>
      )}
    </div>
  );
};

export default AlertList;
