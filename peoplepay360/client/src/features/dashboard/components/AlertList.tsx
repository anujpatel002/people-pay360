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
          dot: '#ef4444',
        };
      case 'WARNING':
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          text: '#92400e',
          dot: '#f59e0b',
        };
      default:
        return {
          bg: '#f0f9ff',
          border: '#bae6fd',
          text: '#0369a1',
          dot: '#0ea5e9',
        };
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Operational Alerts
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Action items and anomalies requiring attention
          </p>
        </div>
        {alerts.length > 0 && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '20px',
              background: '#fee2e2',
              color: '#dc2626',
            }}
          >
            {alerts.reduce((acc, curr) => acc + curr.count, 0)} active
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#10b981',
            background: '#ecfdf5',
            borderRadius: '12px',
            margin: 'auto 0',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>All Clear!</div>
          <div style={{ fontSize: '13px', color: '#047857', marginTop: '4px' }}>
            No operational warnings, duplicate payslips, or expiring contracts.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
          {alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);

            return (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(3px)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: style.dot,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                      {alert.message}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: style.border,
                          color: style.text,
                        }}
                      >
                        {alert.severity}
                      </span>
                      {alert.blocking && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#ef4444',
                            color: '#ffffff',
                          }}
                        >
                          BLOCKING
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      background: '#ffffff',
                      color: style.text,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '12px',
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {alert.count}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>›</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
};
export default AlertList;
