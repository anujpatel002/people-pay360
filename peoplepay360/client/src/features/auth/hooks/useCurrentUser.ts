import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';

export function useCurrentUser() {
  const { user, isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  return { user, role: user?.role ?? null, isAuthenticated, isInitialized };
}
