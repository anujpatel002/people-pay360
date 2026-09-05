import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export default function ProtectedRoute() {
  const { isAuthenticated } = useCurrentUser();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
