import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStructure } from '../hooks/usePayrollConfig';
import { createStructure, updateStructure, createRule, updateRule, deleteRule } from '../services/payroll-config.service';
import RuleSequenceEditor from '../components/RuleSequenceEditor';
import { SalaryRule, RuleFormValues, CATEGORIES, COMPUTATION_METHODS } from '../types';

const BLANK_RULE: RuleFormValues = {
  structureId: '', code: '', name: '', category: 'Basic', sequence: 1,
  computationMethod: 'fixed_amount', amount: null, percentage: null, formula: null, isActive: true,
};

export default function SalaryStructureFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit  = !!id && id !== 'new';
  const navigate = useNavigate();

  const { data: existing, loading, refetch } = { data: null as any, loading: false, refetch: () => {} };
  const { data: fetched, loading: fetchLoading } = useStructure(isEdit ? id! : '');

  const [name,     setName]     = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Rule form state
  const [ruleForm,      setRuleForm]      = useState<RuleFormValues>(BLANK_RULE);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleError,     setRuleError]     = useState<string | null>(null);
  const [ruleSaving,    setRuleSaving]    = useState(false);
  const [rules,         setRules]         = useState<SalaryRule[]>([]);

  useEffect(() => {
    if (fetched) {
      setName(fetched.name);
      setIsActive(fetched.isActive);
      setRules(fetched.rules ?? []);
      setRuleForm((f) => ({ ...f, structureId: fetched.id }));
    }
  }, [fetched]);

  async function handleSaveStructure(e: FormEvent) {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      if (isEdit) { await updateStructure(id!, { name, isActive }); }
      else {
        const created = await createStructure({ name, isActive });
        navigate(`/payroll-config/structures/${created.id}`, { replace: true });
        return;
      }
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.error ?? 'Something went wrong');
    } finally { setSaving(false); }
  }

  async function handleSaveRule(e: FormEvent) {
    e.preventDefault(); setRuleError(null); setRuleSaving(true);
    try {
      if (editingRuleId) {
        const updated = await updateRule(editingRuleId, ruleForm);
        setRules((prev) => prev.map((r) => r.id === editingRuleId ? updated : r));
      } else {
        const created = await createRule({ ...ruleForm, structureId: id! });
        setRules((prev) => [...prev, created]);
      }
      setRuleForm({ ...BLANK_RULE, structureId: id! });
      setEditingRuleId(null);
    } catch (err: unknown) {
      setRuleError((err as any)?.response?.data?.error ?? 'Failed to save rule');
    } finally { setRuleSaving(false); }
  }

  async function handleDeleteRule(ruleId: string, code: string) {
    if (!window.confirm(`Delete rule "${code}"?`)) return;
    try { await deleteRule(ruleId); setRules((prev) => prev.filter((r) => r.id !== ruleId)); }
    catch (err: unknown) { alert((err as any)?.response?.data?.error ?? 'Failed to delete rule'); }
  }

  function handleEditRule(rule: SalaryRule) {
    setEditingRuleId(rule.id);
    setRuleForm({ structureId: rule.structureId, code: rule.code, name: rule.name, category: rule.category,
      sequence: rule.sequence, computationMethod: rule.computationMethod,
      amount: rule.amount, percentage: rule.percentage, formula: rule.formula, isActive: rule.isActive });
  }

  if (isEdit && fetchLoading) return <p style={{ padding: '2rem', color: '#6b7280' }}>Loading…</p>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/payroll-config/structures')}>← Back</button>
        <h2 style={s.title}>{isEdit ? 'Edit Structure' : 'New Structure'}</h2>
      </div>

      {/* Structure form */}
      <form onSubmit={handleSaveStructure} style={s.card}>
        <div style={s.row}>
          <label style={s.label}>
            Structure Name
            <input style={s.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label style={{ ...s.label, flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.4rem' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        </div>
        {error && <p style={s.err}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" style={s.btnSecondary} onClick={() => navigate('/payroll-config/structures')}>Cancel</button>
          <button type="submit" style={s.btnPrimary} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create & Add Rules'}</button>
        </div>
      </form>

      {/* Rules section — only shown after structure is created */}
      {isEdit && (
        <>
          <h3 style={s.sectionTitle}>Salary Rules</h3>
          <RuleSequenceEditor rules={rules} onEdit={handleEditRule} onDelete={handleDeleteRule} />

          {/* Inline rule form */}
          <div style={s.card}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600 }}>
              {editingRuleId ? 'Edit Rule' : 'Add Rule'}
            </h4>
            <form onSubmit={handleSaveRule}>
              <div style={s.ruleGrid}>
                <label style={s.label}>Code<input style={s.input} value={ruleForm.code} onChange={(e) => setRuleForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required /></label>
                <label style={s.label}>Name<input style={s.input} value={ruleForm.name} onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))} required /></label>
                <label style={s.label}>Category
                  <select style={s.select} value={ruleForm.category} onChange={(e) => setRuleForm((f) => ({ ...f, category: e.target.value as any }))}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label style={s.label}>Sequence<input style={s.input} type="number" min={1} value={ruleForm.sequence} onChange={(e) => setRuleForm((f) => ({ ...f, sequence: parseInt(e.target.value) || 1 }))} required /></label>
                <label style={s.label}>Method
                  <select style={s.select} value={ruleForm.computationMethod} onChange={(e) => setRuleForm((f) => ({ ...f, computationMethod: e.target.value as any, amount: null, percentage: null, formula: null }))}>
                    {COMPUTATION_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </label>
                {ruleForm.computationMethod === 'fixed_amount' && (
                  <label style={s.label}>Amount (₹)<input style={s.input} type="number" min={0} value={ruleForm.amount ?? ''} onChange={(e) => setRuleForm((f) => ({ ...f, amount: parseFloat(e.target.value) || null }))} required /></label>
                )}
                {ruleForm.computationMethod === 'percentage_of_gross' && (
                  <label style={s.label}>Percentage (%)<input style={s.input} type="number" min={0} max={100} step={0.01} value={ruleForm.percentage ?? ''} onChange={(e) => setRuleForm((f) => ({ ...f, percentage: parseFloat(e.target.value) || null }))} required /></label>
                )}
                {ruleForm.computationMethod === 'formula' && (
                  <label style={{ ...s.label, gridColumn: 'span 2' }}>Formula<input style={s.input} value={ruleForm.formula ?? ''} placeholder="e.g. BASIC * 0.12" onChange={(e) => setRuleForm((f) => ({ ...f, formula: e.target.value || null }))} required /></label>
                )}
              </div>
              {ruleError && <p style={s.err}>{ruleError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                {editingRuleId && <button type="button" style={s.btnSecondary} onClick={() => { setEditingRuleId(null); setRuleForm({ ...BLANK_RULE, structureId: id! }); }}>Cancel</button>}
                <button type="submit" style={s.btnPrimary} disabled={ruleSaving}>{ruleSaving ? 'Saving…' : editingRuleId ? 'Update Rule' : 'Add Rule'}</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 900, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.3rem', fontWeight: 700 },
  back: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.9rem', padding: 0 },
  card: { background: '#fff', padding: '1.5rem', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '1.5rem' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
  ruleGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem', fontWeight: 500 },
  input: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.875rem' },
  select: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.875rem' },
  sectionTitle: { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600 },
  btnPrimary: { padding: '0.55rem 1.1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  btnSecondary: { padding: '0.55rem 1.1rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  err: { margin: '0.5rem 0 0', color: '#dc2626', fontSize: '0.85rem' },
};
