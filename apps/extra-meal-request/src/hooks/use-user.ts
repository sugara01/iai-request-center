import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export type AppUser = {
  userPrincipalName: string;
  email: string;
  fullName: string;
  department: string | null;
  jobTitle: string | null;
  role: 'User' | 'ITAdmin' | 'SuperAdmin';
  isITAdmin: boolean;
  isVehicleAdmin: boolean;
  isMealAdmin: boolean;
  isSuperAdmin: boolean;
  isApproverDoa: boolean;
  mustChangePassword: boolean;
};

export function useUser() {
  return useQuery({
    queryKey: ['session'],
    queryFn: () => apiRequest<AppUser>('/session'),
    staleTime: 60_000,
    retry: false,
  });
}
