import { useState } from 'react';
import { useTimeOffTypes } from '../hooks/useTimeOff';
import { TimeOffType } from '../types';

export default function TypeConfigPage() {
  const { types, loading, error, create, update } = useTimeOffTypes();
  const [form, setForm] = useState<Partial<TimeOffType>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const reset = () => { setForm({}); setEditing(null); setFormError(''); };

  const startEdit = (t: TimeOffType) => {
    setEditing(t.id);
    setForm({ name: t.name, unit: t.unit, allocationRequired: t.allocationRequired, approvalMode: t.approvalMode, isPaid: t.isPaid, color: t.color ?? '', notes: t.notes ?? '', isActive: t.isActive });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.unit) { setFormError('Name and unit are required'); return; }
    setSaving(true); setFormError('');
    try {
      if (editing) await update(editing, form);
      else await create(form);
      reset();
    } catch (e: any) { setFormError(e?.response?.data?.error ?? 'Save failed'); }
    finally { setSaving(false); }
  };

  const STATUS_COLOR: Record<string, string> = { true: '#16a34a', false: '#6b7280' };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h2 style={{ marginBottom: 20 }}>Leave Types</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 28 }}>
        <h3 style={{ marginBottom: 16 }}>{editing ? 'Edit Type' : 'New Leave Type'}</h3>
        {formError && <p style={{ color: '#ef4444', marginBottom: 12 }}>{formError}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13 }}>Name *</label>
            <input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13 }}>Unit *</label>
            <select value={form.unit ?? ''} onChange={e => setForm(f => ({ ...f, unit: e.target.value as 'days' | 'hours' }))}
              style={{ display: 'block', width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }}>
              <option value="">Select unit</option>
              <option value="days">Days</option>
              <option value="hours">Hours</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13 }}>Approval Mode</label>
            <select value={form.approvalMode ?? 'time_off'} onChange={e => setForm(f => ({ ...f, approvalMode: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }}>
              <option value="no_validation">No Validation</option>
              <option value="time_off">Time Off</option>
              <option value="set_by_time_off_officer">Set by Officer</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13 }}>Color (hex)</label>
            <input value={form.color ?? ''} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              placeholder="#4CAF50"
              style={{ display: 'block', width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', paddingTop: 20 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.allocationRequired ?? true} onChange={e => setForm(f => ({ ...f, allocationRequired: e.target.checked }))} />
              Allocation Required
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.isPaid ?? true} onChange={e => setForm(f => ({ ...f, isPaid: e.target.checked }))} />
              Paid
            </label>
            {editing && (
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
            )}
          </div>
          <div>
            <label style={{ fontSize: 13 }}>Notes</label>
            <input value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="submit" disabled={saving}
            style={{ padding: '7px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </button>
          {editing && <button type="button" onClick={reset}
            style={{ padding: '7px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>}
        </div>
      </form>

      {/* Table */}
      {loading ? <p>Loading...</p> : error ? <p style={{ color: '#ef4444' }}>{error}</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {['Name', 'Unit', 'Allocation Req', 'Paid', 'Approval Mode', 'Active', ''].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t.color && <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, display: 'inline-block' }} />}
                  {t.name}
                </td>
                <td style={{ padding: '10px 12px' }}>{t.unit}</td>
                <td style={{ padding: '10px 12px' }}>{t.allocationRequired ? 'Yes' : 'No'}</td>
                <td style={{ padding: '10px 12px' }}>{t.isPaid ? 'Yes' : 'No'}</td>
                <td style={{ padding: '10px 12px' }}>{t.approvalMode}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: STATUS_COLOR[String(t.isActive)], fontWeight: 600 }}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => startEdit(t)}
                    style={{ padding: '3px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
