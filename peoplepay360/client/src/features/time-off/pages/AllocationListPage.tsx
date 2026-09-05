import { useState } from 'react';
import { useAllocations, useTimeOffTypes } from '../hooks/useTimeOff';

export default function AllocationListPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, total, loading, error, create, reload } = useAllocations(filters);
  const { types } = useTimeOffTypes();

  const handleFilter = (key: string, val: string) =>
    setFilters(f => val ? { ...f, [key]: val } : Object.fromEntries(Object.entries(f).filter(([k]) => k !== key)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.typeId || !form.year || !form.totalDays || !form.validityStart || !form.validityEnd) {
      setFormError('All fields are required'); return;
    }
    setSaving(true); setFormError('');
    try {
      await create({ ...form, year: Number(form.year), totalDays: Number(form.totalDays) });
      setForm({});
    } catch (e: any) { setFormError(e?.response?.data?.error ?? 'Failed to create allocation'); }
    finally { setSaving(false); }
  };

  const STATUS_COLOR: Record<string, string> = {
    Approved: '#16a34a', Draft: '#6b7280', Confirmed: '#2563eb', Refused: '#ef4444',
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <h2 style={{ marginBottom: 20 }}>Leave Allocations</h2>

      {/* Create form */}
      <form onSubmit={handleSubmit} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 28 }}>
        <h3 style={{ marginBottom: 14 }}>New Allocation</h3>
        {formError && <p style={{ color: '#ef4444', marginBottom: 10 }}>{formError}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Employee ID *', key: 'employeeId', type: 'text' },
            { label: 'Year *', key: 'year', type: 'number' },
            { label: 'Total Days *', key: 'totalDays', type: 'number' },
            { label: 'Validity Start *', key: 'validityStart', type: 'date' },
            { label: 'Validity End *', key: 'validityEnd', type: 'date' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 13 }}>{f.label}</label>
              <input type={f.type} value={form[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ display: 'block', width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 13 }}>Leave Type *</label>
            <select value={form.typeId ?? ''} onChange={e => setForm(p => ({ ...p, typeId: e.target.value }))}
              style={{ display: 'block', width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', marginTop: 4 }}>
              <option value="">Select type</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" disabled={saving}
          style={{ marginTop: 14, padding: '7px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Create Allocation'}
        </button>
      </form>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Employee ID" onChange={e => handleFilter('employeeId', e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }} />
        <input placeholder="Year" type="number" onChange={e => handleFilter('year', e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13, width: 90 }} />
        <select onChange={e => handleFilter('typeId', e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }}>
          <option value="">All Types</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <p>Loading...</p> : error ? <p style={{ color: '#ef4444' }}>{error}</p> : (
        <>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Total: {total}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                {['Employee', 'Type', 'Year', 'Allocated', 'Used', 'Remaining', 'Validity', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px' }}>{a.employeeName ?? a.employeeId}</td>
                  <td style={{ padding: '10px 12px' }}>{a.typeName}</td>
                  <td style={{ padding: '10px 12px' }}>{a.year}</td>
                  <td style={{ padding: '10px 12px' }}>{a.totalDays}</td>
                  <td style={{ padding: '10px 12px' }}>{a.usedDays}</td>
                  <td style={{ padding: '10px 12px', color: a.remainingDays <= 2 ? '#ef4444' : '#16a34a', fontWeight: 600 }}>
                    {a.remainingDays}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>{a.validityStart} → {a.validityEnd}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: STATUS_COLOR[a.status] ?? '#6b7280', fontWeight: 600 }}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
