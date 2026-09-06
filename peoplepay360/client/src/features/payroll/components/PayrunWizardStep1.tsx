import { useEffect, useState } from 'react';
import { getContractLookups } from '@/features/contracts/services/contracts.service';

interface Props {
  value: {
    name?: string;
    periodStart?: string;
    periodEnd?: string;
    structureId?: string;
  };
  onChange: (v: any) => void;
  onContinue: () => void;
}

export default function PayrunWizardStep1({ value, onChange, onContinue }: Props) {
  const [structures, setStructures] = useState<{ id: string; name: string }[]>([]);
  const [loadingStructures, setLoadingStructures] = useState(true);

  useEffect(() => {
    getContractLookups()
      .then((data) => {
        if (data.structures && data.structures.length > 0) {
          setStructures(data.structures);
          if (!value.structureId) {
            onChange({ ...value, structureId: data.structures[0].id });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStructures(false));
  }, []);

  const canContinue = value.name && value.periodStart && value.periodEnd;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Step 1: Define Payroll Period & Scope
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Specify the pay cycle name, start date, end date, and salary computation structure.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="app-form-group">
          <label className="app-label">
            Payrun Name <span className="app-label-required">*</span>
          </label>
          <input
            className="app-input"
            placeholder="e.g. March 2026 Regular Payroll"
            value={value.name ?? ''}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="app-form-group">
            <label className="app-label">
              Period Start Date <span className="app-label-required">*</span>
            </label>
            <input
              type="date"
              className="app-input"
              value={value.periodStart ?? ''}
              onChange={(e) => onChange({ ...value, periodStart: e.target.value })}
              required
            />
          </div>

          <div className="app-form-group">
            <label className="app-label">
              Period End Date <span className="app-label-required">*</span>
            </label>
            <input
              type="date"
              className="app-input"
              value={value.periodEnd ?? ''}
              onChange={(e) => onChange({ ...value, periodEnd: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="app-form-group">
          <label className="app-label">Salary Computation Structure</label>
          {loadingStructures ? (
            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12.5px', color: '#64748b' }}>
              Loading available salary structures...
            </div>
          ) : (
            <select
              className="app-select"
              value={value.structureId ?? ''}
              onChange={(e) => onChange({ ...value, structureId: e.target.value })}
            >
              <option value="">-- Standard Active Salary Structure (Default) --</option>
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
            Rules from this salary structure will compute basic pay, allowances, PF, TDS deductions, and net payouts.
          </span>
        </div>
      </div>

      <div
        style={{
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          fontSize: '12.5px',
          color: '#475569',
        }}
      >
        💡 <strong>Note:</strong> Continuing to Step 2 allows you to select employees by searching the roster or pasting employee IDs / numbers.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="app-btn app-btn-primary"
        >
          <span>Continue to Employee Selection ›</span>
        </button>
      </div>
    </div>
  );
}
