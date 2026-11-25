import { useQuery } from '@tanstack/react-query';
import { apiRequest, getDemoUserEmail } from '@/lib/api';

export type AppUser = {
  userPrincipalName: string;
  fullName: string;
  isVehicleAdmin: boolean;
  isMealAdmin: boolean;
  isSuperAdmin: boolean;
};

export type DemoUser = { email: string; fullName: string };

export function useUser() {
  const email = getDemoUserEmail();
  return useQuery({
    queryKey: ['session', email],
    queryFn: () => apiRequest<AppUser>('/session'),
    staleTime: 60_000,
  });
}

export function useDemoUsers() {
  return useQuery({
    queryKey: ['demo-users'],
    queryFn: () => apiRequest<DemoUser[]>('/demo-users'),
    staleTime: Infinity,
  });
}
