import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getContract, createContract, updateContract } from '../services/contracts.service';
import { ContractFormValues, ContractStatus } from '../types/contract.types';

const STATUSES: ContractStatus[] = ['New', 'Running', 'Expired', 'Cancelled'];

const EMPTY: ContractFormValues = {
  employeeId: '', contractRef: '', status: 'New',
  department: '', jobPosition: '', wage: 0,
  startDate: '', endDate: '', scheduleId: '', structureId: '', notes: '',
};

export default function ContractFormPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const isEdit     = Boolean(id && id !== 'new');

  const [form, setForm]     = useState<ContractFormValues>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    getContract(id).then((c) => setForm({
      employeeId: c.employeeId, contractRef: c.contractRef ?? '',
      status: c.status, department: c.department ?? '',
      jobPosition: c.jobPosition ?? '', wage: c.wage,
      startDate: c.startDate, endDate: c.endDate ?? '',
      scheduleId: c.scheduleId ?? '', structureId: c.structureId ?? '',
      notes: c.notes ?? '',
    })).catch(() => setError('Failed to load contract'));
  }, [id, isEdit]);

  function set(field: keyof ContractFormValues, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form, endDate: form.endDate || null, wage: Number(form.wage) };
      if (isEdit && id) {
        await updateContract(id, payload);
      } else {
        await createContract(payload);
      }
      navigate('/contracts');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>{isEdit ? 'Edit Contract' : 'New Contract'}</h2>
      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <label style={styles.label}>Employee ID *
            <input style={styles.input} value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} required disabled={isEdit} />
          </label>
          <label style={styles.label}>Contract Ref
            <input style={styles.input} value={form.contractRef} onChange={(e) => set('contractRef', e.target.value)} />
          </label>
          <label style={styles.label}>Status
            <select style={styles.input} value={form.status} onChange={(e) => set('status', e.target.value as ContractStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label style={styles.label}>Department
            <input style={styles.input} value={form.department} onChange={(e) => set('department', e.target.value)} />
          </label>
          <label style={styles.label}>Job Position
            <input style={styles.input} value={form.jobPosition} onChange={(e) => set('jobPosition', e.target.value)} />
          </label>
          <label style={styles.label}>Wage / Month *
            <input style={styles.input} type="number" min={0} value={form.wage} onChange={(e) => set('wage', e.target.value)} required />
          </label>
          <label style={styles.label}>Start Date *
            <input style={styles.input} type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </label>
          <label style={styles.label}>End Date (leave blank = open-ended)
            <input style={styles.input} type="date" value={form.endDate ?? ''} onChange={(e) => set('endDate', e.target.value)} />
          </label>
          <label style={styles.label}>Schedule ID
            <input style={styles.input} value={form.scheduleId} onChange={(e) => set('scheduleId', e.target.value)} />
          </label>
          <label style={styles.label}>Salary Structure ID
            <input style={styles.input} value={form.structureId} onChange={(e) => set('structureId', e.target.value)} />
          </label>
        </div>

        <label style={{ ...styles.label, gridColumn: 'span 2' }}>Notes
          <textarea style={{ ...styles.input, height: 80 }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        <div style={styles.actions}>
          <button type="button" style={styles.cancelBtn} onClick={() => navigate('/contracts')}>Cancel</button>
          <button type="submit" style={styles.saveBtn} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Update Contract' : 'Create Contract'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:      { padding: '1.5rem 2rem', maxWidth: 900 },
  title:     { margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 700 },
  form:      { display: 'flex', flexDirection: 'column', gap: '1rem' },
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label:     { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem', fontWeight: 500 },
  input:     { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' },
  actions:   { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' },
  saveBtn:   { padding: '0.6rem 1.5rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { padding: '0.6rem 1.5rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' },
  error:     { color: '#dc2626', fontSize: '0.875rem', margin: '0 0 0.5rem' },
};
