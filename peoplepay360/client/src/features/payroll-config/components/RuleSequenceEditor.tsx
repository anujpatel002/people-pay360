import { SalaryRule, CATEGORY_COLORS } from '../types';

interface Props {
  rules: SalaryRule[];
  onEdit: (rule: SalaryRule) => void;
  onDelete: (id: string, code: string) => void;
}

export default function RuleSequenceEditor({ rules, onEdit, onDelete }: Props) {
  const sorted = [...rules].sort((a, b) => a.sequence - b.sequence || a.code.localeCompare(b.code));

  if (!sorted.length) {
    return <p style={{ color: '#9ca3af', fontSize: '0.875rem', padding: '1rem 0' }}>No rules yet. Add the first rule.</p>;
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        {['Seq', 'Code', 'Name', 'Category', 'Method', 'Value', 'Actions'].map((h) => (
          <span key={h} style={s.col}>{h}</span>
        ))}
      </div>
      {sorted.map((rule) => (
        <div key={rule.id} style={{ ...s.row, opacity: rule.isActive ? 1 : 0.5 }}>
          <span style={{ ...s.col, fontWeight: 600, color: '#6b7280' }}>{rule.sequence}</span>
          <span style={{ ...s.col, fontFamily: 'monospace', fontWeight: 600 }}>{rule.code}</span>
          <span style={s.col}>{rule.name}</span>
          <span style={s.col}>
            <span style={{ ...s.badge, background: CATEGORY_COLORS[rule.category as keyof typeof CATEGORY_COLORS] }}>
              {rule.category}
            </span>
          </span>
          <span style={{ ...s.col, fontSize: '0.75rem', color: '#6b7280' }}>
            {rule.computationMethod.replace(/_/g, ' ')}
          </span>
          <span style={{ ...s.col, fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {rule.computationMethod === 'fixed_amount'        && `₹${rule.amount}`}
            {rule.computationMethod === 'percentage_of_gross' && `${rule.percentage}%`}
            {rule.computationMethod === 'formula'             && rule.formula}
          </span>
          <span style={s.col}>
            <button style={s.btnLink} onClick={() => onEdit(rule)}>Edit</button>
            <button style={{ ...s.btnLink, color: '#dc2626' }} onClick={() => onDelete(rule.id, rule.code)}>Del</button>
          </span>
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  header:  { display: 'grid', gridTemplateColumns: '50px 90px 1fr 110px 160px 160px 100px', background: '#f9fafb', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  row:     { display: 'grid', gridTemplateColumns: '50px 90px 1fr 110px 160px 160px 100px', alignItems: 'center', padding: '0.6rem 1rem', borderBottom: '1px solid #f3f4f6' },
  col:     { fontSize: '0.85rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge:   { padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.72rem', fontWeight: 500 },
  btnLink: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.8rem', marginRight: 6, padding: 0 },
};
