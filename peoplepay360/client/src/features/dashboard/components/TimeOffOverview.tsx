import React from 'react';
import { TimeOffOverview as TimeOffData } from '../types/dashboard.types';

interface TimeOffOverviewProps {
  data: TimeOffData;
}

export const TimeOffOverview: React.FC<TimeOffOverviewProps> = ({ data }) => {
  return (
    <div className="dash-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
            Time-Off Overview
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--dash-text-muted)' }}>
            Approved leave durations and organization-wide leave balances
          </p>
        </div>

        {data.pendingRequests > 0 && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
            }}
          >
            {data.pendingRequests} pending {data.pendingRequests === 1 ? 'approval' : 'approvals'}
          </span>
        )}
      </div>

      {/* Top Stat Dual Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '1px solid #a7f3d0',
            padding: '18px 20px',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approved Days in Scope
            </span>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#065f46', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {data.approvedDays} <span style={{ fontSize: '14px', fontWeight: 600 }}>days</span>
            </div>
          </div>

          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            padding: '18px 20px',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Manager Review
            </span>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#92400e', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {data.pendingRequests} <span style={{ fontSize: '14px', fontWeight: 600 }}>requests</span>
            </div>
          </div>

          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Leave Balances List */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 750, color: '#334155', marginBottom: '12px' }}>
          Leave Balances Breakdown
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {data.balancesByType.length === 0 ? (
            <div style={{ color: 'var(--dash-text-subtle)', fontSize: '13px', fontStyle: 'italic', padding: '12px 0' }}>
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
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#4f46e5',
                    }}
                  />
                  <span style={{ fontWeight: 650, fontSize: '13px', color: '#1e293b' }}>
                    {item.typeName}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                    {item.totalRemaining ?? 0}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                    days left
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeOffOverview;
