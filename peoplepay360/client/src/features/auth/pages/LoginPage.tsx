import { FormEvent, useState } from 'react';
import { useLogin } from '../hooks/useLogin';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { submit, error, loading } = useLogin();

  const seededAccounts = [
    { email: 'anuj.patel@company.com', name: 'Anuj Patel', role: 'Admin' },
    { email: 'priya.sharma@company.com', name: 'Priya Sharma', role: 'HR Manager' },
    { email: 'neha.desai@company.com', name: 'Neha Desai', role: 'HR Payroll Manager' },
    { email: 'rahul.verma@company.com', name: 'Rahul Verma', role: 'HR Payroll User' },
    { email: 'vikram.singh@company.com', name: 'Vikram Singh', role: 'Employee' },
    { email: 'sneha.patel@company.com', name: 'Sneha Patel', role: 'Employee' },
    { email: 'amit.kumar@company.com', name: 'Amit Kumar', role: 'Employee' },
    { email: 'kavita.reddy@company.com', name: 'Kavita Reddy', role: 'Employee' },
  ];

  function handleSeededAccountChange(value: string) {
    setEmail(value);
    if (value) setPassword('Test@1234');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit(email, password);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #0f172a 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.25) 0%, rgba(15, 23, 42, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="app-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Emblem */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
              marginBottom: '14px',
            }}
          >
            P
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            PeoplePay360
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Sign in to access your HR & Payroll workspace
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Seeded Account 1-Click Select */}
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
              ⚡ QUICK SEEDED ACCOUNT AUTOFILL
            </label>
            <select
              value={email}
              onChange={(e) => handleSeededAccountChange(e.target.value)}
              className="app-select"
              style={{ width: '100%', fontSize: '13px', padding: '8px 10px' }}
            >
              <option value="">Select a demo account...</option>
              {seededAccounts.map((acc) => (
                <option key={acc.email} value={acc.email}>
                  {acc.name} — [{acc.role}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="app-label">Work Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="app-input"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label className="app-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="app-input"
              style={{ width: '100%' }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="app-btn app-btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '6px' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
