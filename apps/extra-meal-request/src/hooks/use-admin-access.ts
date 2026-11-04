import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { initialize } from '@microsoft/power-apps/app';
import { AdminAcessService } from '@/generated/services/admin-acess-service';
import type { AdminAcess } from '@/generated/models/admin-acess-model';

export const SUPER_ADMIN_EMAIL = 'riyan.sugara@ineos.com';
const INITIAL_FULL_ADMINS = new Set([SUPER_ADMIN_EMAIL, 'aris.kristanto@ineos.com', 'defiani.defiani@ineos.com']);
const QUERY_KEY = ['admin-access'];

const isEnabled = (value: string | undefined) => value?.trim().toLowerCase() === 'yes' || value?.trim().toLowerCase() === 'true';

export function useAdminAccessList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      await initialize();
      return AdminAcessService.getAll();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminAuthorization(email: string | undefined) {
  const query = useAdminAccessList();
  const normalizedEmail = email?.trim().toLowerCase() ?? '';
  const record = query.data?.find((item: AdminAcess) => item.title.trim().toLowerCase() === normalizedEmail);
  const hasInitialAccess = INITIAL_FULL_ADMINS.has(normalizedEmail);
  return {
    ...query,
    isVehicleAdmin: hasInitialAccess || isEnabled(record?.vehicleAdmin),
    isMealAdmin: hasInitialAccess || isEnabled(record?.mealAdmin),
    isSuperAdmin: normalizedEmail === SUPER_ADMIN_EMAIL,
  };
}

export function useSaveAdminAccess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ existing, email, vehicleAdmin, mealAdmin }: { existing?: AdminAcess; email: string; vehicleAdmin: boolean; mealAdmin: boolean }) => {
      await initialize();
      const values: Omit<AdminAcess, 'id'> = {
        title: email.trim().toLowerCase(),
        vehicleAdmin: vehicleAdmin ? 'Yes' : 'No',
        mealAdmin: mealAdmin ? 'Yes' : 'No',
      };
      return existing
        ? AdminAcessService.update(String(existing.id), values)
        : AdminAcessService.create(values);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteAdminAccess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (record: AdminAcess) => {
      await initialize();
      return AdminAcessService.delete(String(record.id));
    },
    onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
