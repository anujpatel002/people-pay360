import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth.service';
import { clearCredentials } from '../store/auth.slice';
import { AppDispatch } from '@/app/store';

export function useLogout() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      dispatch(clearCredentials());
      navigate('/login');
    }
  }

  return { handleLogout };
}
