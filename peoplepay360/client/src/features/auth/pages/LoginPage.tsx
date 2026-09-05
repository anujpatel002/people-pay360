import { FormEvent, useState } from 'react';
import { useLogin } from '../hooks/useLogin';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { submit, error, loading } = useLogin();
  const seededEmails = [
    'anuj.patel@company.com',
    'priya.sharma@company.com',
    'neha.desai@company.com',
    'rahul.verma@company.com',
    'vikram.singh@company.com',
    'sneha.patel@company.com',
    'amit.kumar@company.com',
    'kavita.reddy@company.com',
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
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>PeoplePay360</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Seeded Account
            <select
              value={email}
              onChange={(e) => handleSeededAccountChange(e.target.value)}
              style={styles.input}
            >
              <option value="">Select an account</option>
              {seededEmails.map((seededEmail) => (
                <option key={seededEmail} value={seededEmail}>
                  {seededEmail}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Work Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={styles.input}
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f6fa',
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e' },
  subtitle: { margin: '0.25rem 0 1.5rem', color: '#666', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 500 },
  input: { padding: '0.6rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.95rem' },
  error: { margin: 0, color: '#dc2626', fontSize: '0.85rem' },
  button: {
    marginTop: '0.5rem',
    padding: '0.7rem',
    borderRadius: 6,
    border: 'none',
    background: '#4f46e5',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
};
