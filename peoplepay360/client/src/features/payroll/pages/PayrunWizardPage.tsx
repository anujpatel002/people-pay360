import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Step1 from '../components/PayrunWizardStep1';
import Step2 from '../components/PayrunWizardStep2';
import { createPayrun } from '../services/payroll.service';

export default function PayrunWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [value, setValue] = useState<any>({});
  const [ids, setIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const r = await createPayrun({ ...value, employeeIds: ids });
      navigate(`/payroll/${r.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create payrun');
      setCreating(false);
    }
  };

  return (
    <div className="app-page">
      <div className="app-page-container" style={{ maxWidth: '680px' }}>
        {/* Header */}
        <div className="app-page-header">
          <div className="app-page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <button
                type="button"
                onClick={() => navigate('/payroll')}
                className="app-btn app-btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                ← Back to Payroll
              </button>
              <h1 className="app-page-title">New Payrun Wizard</h1>
            </div>
            <p className="app-page-subtitle">
              Set up a new payroll run in 2 simple steps
            </p>
          </div>
        </div>

        {/* Stepper Progress */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: step >= 1 ? 'var(--primary-600)' : '#e2e8f0',
                color: step >= 1 ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              1
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: step === 1 ? 700 : 500, color: step === 1 ? '#0f172a' : '#64748b' }}>
              Period & Scope
            </span>
          </div>

          <div style={{ width: '40px', height: '2px', background: step === 2 ? 'var(--primary-600)' : '#e2e8f0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: step === 2 ? 'var(--primary-600)' : '#e2e8f0',
                color: step === 2 ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              2
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: step === 2 ? 700 : 500, color: step === 2 ? '#0f172a' : '#64748b' }}>
              Select Employees
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '13.5px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <div className="app-card" style={{ padding: '24px' }}>
          {step === 1 ? (
            <Step1 value={value} onChange={setValue} onContinue={() => setStep(2)} />
          ) : (
            <Step2
              ids={ids}
              setIds={setIds}
              onBack={() => setStep(1)}
              onCreate={create}
            />
          )}
        </div>
      </div>
    </div>
  );
}
