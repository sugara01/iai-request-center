import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminAcess } from '@/generated/models/admin-acess-model';
import { apiRequest } from '@/lib/api';
import { useUser } from '@/hooks/use-user';

export const SUPER_ADMIN_EMAIL = 'riyan.sugara@ineos.com';
const QUERY_KEY = ['admin-access'];

export function useAdminAccessList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiRequest<AdminAcess[]>('/admin-access'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminAuthorization(_email: string | undefined) {
  const query = useUser();
  return {
    ...query,
    isVehicleAdmin: query.data?.isVehicleAdmin ?? false,
    isMealAdmin: query.data?.isMealAdmin ?? false,
    isSuperAdmin: query.data?.isSuperAdmin ?? false,
  };
}

export function useSaveAdminAccess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ email, vehicleAdmin, mealAdmin }: { existing?: AdminAcess; email: string; vehicleAdmin: boolean; mealAdmin: boolean }) =>
      apiRequest<AdminAcess>(`/admin-access/${encodeURIComponent(email.trim().toLowerCase())}`, {
        method: 'PUT',
        body: JSON.stringify({ vehicleAdmin, mealAdmin }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteAdminAccess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (record: AdminAcess) => {
      return apiRequest<void>(`/admin-access/${record.id}`, { method: 'DELETE' });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
