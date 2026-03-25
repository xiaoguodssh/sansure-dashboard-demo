import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth/useAuthStore';

export function RequireAuth() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
