import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeOffTypes, useBalance } from '../hooks/useTimeOff';
import { createRequest } from '../services/time-off.service';
import BalanceIndicator from '../components/BalanceIndicator';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

export default function RequestFormPage() {
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);
  const { types } = useTimeOffTypes();

  const [form, setForm] = useState({ typeId: '', startDate: '', endDate: '', days: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-compute days when dates change
  useEffect(() => {
    if (form.startDate && form.endDate && form.endDate >= form.startDate) {
      const start = new Date(form.startDate);
      const end   = new Date(form.endDate);
      const diff  = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setForm(f => ({ ...f, days: String(diff) }));
    }
  }, [form.startDate, form.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.typeId || !form.startDate || !form.endDate || !form.days) {
      setError('Type, start date, end date and days are required'); return;
    }
    setSaving(true); setError('');
    try {
      await createRequest({
        typeId: form.typeId, startDate: form.startDate,
        endDate: form.endDate, days: Number(form.days),
        reason: form.reason || undefined,
      });
      navigate('/time-off/requests');
    } catch (e: any) { setError(e?.response?.data?.error ?? 'Failed to submit request'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2 style={{ marginBottom: 20 }}>New Leave Request</h2>

      {user?.employeeId && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 10, fontSize: 14, color: '#374151' }}>Your Leave Balance</h4>
          <BalanceIndicator employeeId={user.employeeId} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>}

        <div>
          <label style={{ fontSize: 13 }}>Leave Type *</label>
          <select value={form.typeId} onChange={e => setForm(f => ({ ...f, typeId: e.target.value }))}
            style={{ display: 'block', width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }}>
            <option value="">Select type</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13 }}>Start Date *</label>
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 13 }}>End Date *</label>
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13 }}>Duration (days) *</label>
          <input type="number" value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))}
            min="0.5" step="0.5"
            style={{ display: 'block', width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }} />
        </div>

        <div>
          <label style={{ fontSize: 13 }}>Reason</label>
          <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            rows={3} placeholder="Optional reason for the request"
            style={{ display: 'block', width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={saving}
            style={{ padding: '8px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
          <button type="button" onClick={() => navigate('/time-off/requests')}
            style={{ padding: '8px 16px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
