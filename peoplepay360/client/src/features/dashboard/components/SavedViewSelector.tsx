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
  activeFilters,
  onApplyView,
  onSaveCurrentView,
  onDeleteView,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
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
      <select
        value=""
        onChange={(e) => {
          const v = savedViews.find((sv) => sv.id === e.target.value);
          if (v) onApplyView(v);
        }}
        style={{
          padding: '8px 12px',
          borderRadius: '10px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#334155',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
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

      <button
        onClick={() => setShowSaveModal(true)}
        style={{
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px solid #6366f1',
          background: '#eef2ff',
          color: '#4f46e5',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>💾</span> Save View
      </button>

      {/* Save Modal */}
      {showSaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Save Filter Combination
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Save current filter parameters (Period: {activeFilters.period || 'Current'}, Company, Department, Employment Type) as a preset.
            </p>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  View Name
                </label>
                <input
                  type="text"
                  required
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g. Engineering Full-Time 2024"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="makeDefault"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                />
                <label htmlFor="makeDefault" style={{ fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  Set as my default dashboard view
                </label>
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4f46e5',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : 'Save View'}
                </button>
              </div>
            </form>

            {/* List existing views to allow deletion */}
            {savedViews.length > 0 && (
              <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Manage Saved Views
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {savedViews.map((sv) => (
                    <div
                      key={sv.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        padding: '6px 8px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                      }}
                    >
                      <span style={{ color: '#1e293b' }}>
                        {sv.name} {sv.isDefault ? '★' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteView(sv.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SavedViewSelector;
