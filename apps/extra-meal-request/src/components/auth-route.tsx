import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

export function AuthRoute({ children }: { children: ReactNode }) {
  const { data: user, isPending, isError } = useUser();
  const location = useLocation();

  if (isPending) {
    return <div className="grid min-h-screen place-items-center"><LoaderCircle className="size-7 animate-spin" aria-label="Memuat sesi" /></div>;
  }
  if (isError || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return children;
}
