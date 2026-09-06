import React, { useState } from 'react';
import { DashboardSavedView, DashboardFilters } from '../types/dashboard.types';

interface SavedViewSelectorProps {
  savedViews: DashboardSavedView[];
  activeFilters: DashboardFilters;
  onApplyView: (view: DashboardSavedView) => void;
  onSaveCurrentView: (name: string, isDefault: boolean) => Promise<void>;
  onDeleteView: (id: string) => Promise<void>;
}

export const SavedViewSelector: React.FC<SavedViewSelectorProps> = ({
  savedViews,
  activeFilters: _activeFilters,
  onApplyView,
  onSaveCurrentView,
  onDeleteView,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSaveCurrentView(newViewName.trim(), makeDefault);
      setNewViewName('');
      setMakeDefault(false);
      setShowSaveModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save view');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Saved View Selector Dropdown */}
      <div style={{ position: 'relative' }}>
        <select
          value=""
          onChange={(e) => {
            const v = savedViews.find((sv) => sv.id === e.target.value);
            if (v) onApplyView(v);
          }}
          className="dash-select"
          style={{
            padding: '8px 30px 8px 12px',
            borderRadius: '10px',
            background: '#ffffff',
            color: '#334155',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            minWidth: '150px',
          }}
        >
          <option value="" disabled>
            Saved Views ({savedViews.length})
          </option>
          {savedViews.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} {v.isDefault ? '★ (Default)' : ''}
            </option>
          ))}
        </select>
        <div
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#64748b',
            display: 'flex',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Save Current View Action Button */}
      <button
        type="button"
        onClick={() => setShowSaveModal(true)}
        className="dash-btn dash-btn-subtle"
        style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '10px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        Save View
      </button>

      {/* Manage Views Trigger if views exist */}
      {savedViews.length > 0 && (
        <button
          type="button"
          onClick={() => setShowManageModal(true)}
          title="Manage Saved Views"
          className="dash-btn dash-btn-secondary"
          style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '10px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      )}

      {/* Save View Frosted Modal */}
      {showSaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
            animation: 'dashFadeIn 0.2s ease',
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Save Current View
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
              Save your current period, company, department, and employment type filters for one-click access.
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

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  VIEW NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering Current Month"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="dash-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                  autoFocus
                />
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#334155',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                />
                <span>Set as default view when dashboard opens</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="dash-btn dash-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newViewName.trim()}
                  className="dash-btn dash-btn-primary"
                >
                  {saving ? 'Saving...' : 'Save View'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Views Modal */}
      {showManageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px',
            animation: 'dashFadeIn 0.2s ease',
          }}
          onClick={() => setShowManageModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Manage Saved Views
              </h3>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {savedViews.map((view) => (
                <div
                  key={view.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                      {view.name} {view.isDefault && <span style={{ color: '#4f46e5' }}>★ Default</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Period: {view.period || 'All'} {view.employmentType ? `· ${view.employmentType}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyView(view);
                        setShowManageModal(false);
                      }}
                      className="dash-btn dash-btn-subtle"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Delete saved view "${view.name}"?`)) {
                          await onDeleteView(view.id);
                        }
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#b91c1c',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="dash-btn dash-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedViewSelector;
