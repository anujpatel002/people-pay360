import React, { useState } from 'react';
import { DashboardAlert, AlertStatus } from '../types/dashboard.types';
import { dashboardService } from '../services/dashboard.service';

interface AlertDetailProps {
  alert: DashboardAlert;
  onClose: () => void;
  onStatusChanged: (updated: DashboardAlert) => void;
}

export const AlertDetail: React.FC<AlertDetailProps> = ({ alert, onClose, onStatusChanged }) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = async (newStatus: AlertStatus) => {
    setUpdating(true);
    setError(null);
    try {
      const updated = await dashboardService.updateAlertStatus(alert.id, newStatus);
      onStatusChanged(updated);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update alert status');
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityBadge = () => {
    switch (alert.severity) {
      case 'CRITICAL':
        return { bg: '#fee2e2', color: '#991b1b', label: 'CRITICAL' };
      case 'WARNING':
        return { bg: '#fef3c7', color: '#92400e', label: 'WARNING' };
      default:
        return { bg: '#e0f2fe', color: '#0369a1', label: 'INFO' };
    }
  };

  const sev = getSeverityBadge();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: sev.bg,
                  color: sev.color,
                }}
              >
                {sev.label}
              </span>
              {alert.blocking && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#ef4444',
                    color: '#ffffff',
                  }}
                >
                  BLOCKING
                </span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  color: '#475569',
                }}
              >
                Status: {alert.status}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              {alert.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ margin: '20px 0', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 12px 0' }}>{alert.message}</p>

          <div
            style={{
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '12px',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Entity Type:</span>{' '}
              <strong style={{ color: '#0f172a' }}>{alert.entityType || 'General'}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>First Detected:</span>{' '}
              <strong style={{ color: '#0f172a' }}>
                {alert.firstDetectedAt ? new Date(alert.firstDetectedAt).toLocaleDateString() : 'N/A'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Last Detected:</span>{' '}
              <strong style={{ color: '#0f172a' }}>
                {alert.lastDetectedAt ? new Date(alert.lastDetectedAt).toLocaleDateString() : 'N/A'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Resolved:</span>{' '}
              <strong style={{ color: '#0f172a' }}>
                {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleDateString() : 'No'}
              </strong>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          {alert.status === 'OPEN' && (
            <button
              disabled={updating}
              onClick={() => handleStatusUpdate('ACKNOWLEDGED')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Acknowledge
            </button>
          )}

          {(alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED') && (
            <>
              <button
                disabled={updating}
                onClick={() => handleStatusUpdate('DISMISSED')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #fecdd3',
                  background: '#fff1f2',
                  color: '#e11d48',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
              <button
                disabled={updating}
                onClick={() => handleStatusUpdate('RESOLVED')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mark Resolved
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default AlertDetail;
