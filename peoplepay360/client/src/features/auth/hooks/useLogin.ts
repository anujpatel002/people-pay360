import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../services/auth.service';
import { setCredentials } from '../store/auth.slice';
import { AppDispatch } from '@/app/store';

export function useLogin() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await login(email, password);
      dispatch(setCredentials({ accessToken, user }));
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return { submit, error, loading };
}
