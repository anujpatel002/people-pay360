import React from 'react';
import { TimeOffOverview as TimeOffData } from '../types/dashboard.types';

interface TimeOffOverviewProps {
  data: TimeOffData;
}

export const TimeOffOverview: React.FC<TimeOffOverviewProps> = ({ data }) => {
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
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Time-Off Overview
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Approved durations and available leave balances
          </p>
        </div>
        {data.pendingRequests > 0 && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#fef3c7',
              color: '#b45309',
            }}
          >
            {data.pendingRequests} pending {data.pendingRequests === 1 ? 'request' : 'requests'}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '16px',
            borderRadius: '12px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>
            Approved Days in Scope
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
            {data.approvedDays}
          </div>
        </div>

        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '16px',
            borderRadius: '12px',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>
            Pending Approval
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
            {data.pendingRequests}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
        Leave Balances by Type
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.balancesByType.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
            No leave types configured.
          </div>
        ) : (
          data.balancesByType.map((item) => (
            <div
              key={item.typeId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #f1f5f9',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                {item.typeName}
              </span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: item.totalRemaining === null ? '#94a3b8' : '#0f172a',
                }}
              >
                {item.totalRemaining === null ? 'N/A' : `${item.totalRemaining} days remaining`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default TimeOffOverview;
