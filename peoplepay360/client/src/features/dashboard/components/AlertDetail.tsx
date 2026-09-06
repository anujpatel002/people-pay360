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
        return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca', label: 'CRITICAL' };
      case 'WARNING':
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'WARNING' };
      default:
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'INFO' };
    }
  };

  const sev = getSeverityBadge();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
        animation: 'dashFadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '540px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)',
          border: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: sev.bg,
                  color: sev.color,
                  border: `1px solid ${sev.border}`,
                  letterSpacing: '0.04em',
                }}
              >
                {sev.label}
              </span>
              {alert.blocking && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: '#ef4444',
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                  }}
                >
                  BLOCKING
                </span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  background: '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                {alert.type}
              </span>
            </div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              {alert.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Message */}
        <p style={{ margin: '16px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
          {alert.message}
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Audit Details Box */}
        <div
          style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Status</span>
            <strong style={{ color: '#0f172a' }}>{alert.status}</strong>
          </div>
          {alert.entityType && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Referenced Entity</span>
              <strong style={{ color: '#0f172a' }}>{alert.entityType} ({alert.entityId || 'N/A'})</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>First Detected</span>
            <span style={{ color: '#334155' }}>{new Date(alert.firstDetectedAt).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Last Updated</span>
            <span style={{ color: '#334155' }}>{new Date(alert.lastDetectedAt).toLocaleString()}</span>
          </div>
          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Payload Metadata
              </span>
              <pre
                style={{
                  margin: '4px 0 0 0',
                  padding: '8px',
                  background: '#0f172a',
                  color: '#38bdf8',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(alert.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {alert.status === 'OPEN' && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStatusUpdate('ACKNOWLEDGED')}
              className="dash-btn dash-btn-secondary"
            >
              Acknowledge
            </button>
          )}

          {alert.status !== 'RESOLVED' && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStatusUpdate('RESOLVED')}
              className="dash-btn"
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
              }}
            >
              Mark Resolved
            </button>
          )}

          {alert.status !== 'DISMISSED' && (
            <button
              type="button"
              disabled={updating}
              onClick={() => handleStatusUpdate('DISMISSED')}
              className="dash-btn"
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDetail;
