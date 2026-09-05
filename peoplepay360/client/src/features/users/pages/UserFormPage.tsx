import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser, useCreateUser, useUpdateUser } from '../hooks/useUsers';
import { UserRole } from '@/shared/types/api.types';

const ROLES: UserRole[] = ['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager', 'Admin'];

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();

  const { data: existing, isLoading } = useUser(isEdit ? id! : '');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(id ?? '');

  const [name, setName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [employeeId, setEmployeeId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setWorkEmail(existing.workEmail);
      setRole(existing.role);
      setEmployeeId(existing.employeeId);
      setIsActive(existing.isActive);
    }
  }, [existing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updateUser.mutateAsync({ name, role, isActive });
      } else {
        await createUser.mutateAsync({ name, workEmail, password, role, employeeId });
      }
      navigate('/users');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Something went wrong';
      setError(msg);
    }
  }

  if (isEdit && isLoading) return <p style={s.info}>Loading…</p>;

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/users')}>← Back</button>
        <h2 style={s.title}>{isEdit ? 'Edit User' : 'New User'}</h2>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>
        <label style={s.label}>
          Full Name
          <input style={s.input} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        {!isEdit && (
          <>
            <label style={s.label}>
              Work Email
              <input style={s.input} type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} required />
            </label>
            <label style={s.label}>
              Password
              <input style={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </label>
            <label style={s.label}>
              Employee ID
              <input style={s.input} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required placeholder="UUID of linked employee" />
            </label>
          </>
        )}

        <label style={s.label}>
          Role
          <select style={s.select} value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        {isEdit && (
          <label style={{ ...s.label, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        )}

        {error && <p style={s.error}>{error}</p>}

        <div style={s.actions}>
          <button type="button" style={s.btnSecondary} onClick={() => navigate('/users')}>Cancel</button>
          <button type="submit" style={s.btnPrimary} disabled={isPending}>
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 560, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.3rem', fontWeight: 700 },
  back: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.9rem', padding: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', padding: '1.5rem', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 500 },
  input: { padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' },
  select: { padding: '0.55rem 0.75rem', borderRadius: 6, border: '1px solid #d1d5db', fontSize: '0.9rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' },
  btnPrimary: { padding: '0.6rem 1.2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  btnSecondary: { padding: '0.6rem 1.2rem', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  error: { margin: 0, color: '#dc2626', fontSize: '0.85rem' },
  info: { color: '#6b7280' },
};
