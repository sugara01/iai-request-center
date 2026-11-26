import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { useAdminAuthorization } from '@/hooks/use-admin-access';

type AdminRouteProps = { children: ReactNode; role: 'vehicle' | 'meal' | 'request-admin' | 'super' | 'user-admin' };

export function AdminRoute({ children, role }: AdminRouteProps) {
  const { data: user, isPending: isUserPending } = useUser();
  const access = useAdminAuthorization(user?.userPrincipalName);
  if (isUserPending || access.isPending) return <div className="grid min-h-[60vh] place-items-center"><LoaderCircle className="size-7 animate-spin" aria-label="Memuat akses" /></div>;
  const allowed = role === 'super'
    ? access.isSuperAdmin
    : role === 'user-admin'
      ? access.isITAdmin || access.isSuperAdmin
      : role === 'request-admin'
        ? access.isVehicleAdmin || access.isMealAdmin
        : role === 'meal'
          ? access.isMealAdmin
          : access.isVehicleAdmin;
  return allowed ? children : <Navigate to="/" replace />;
}
