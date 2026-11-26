import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';

export function useAdminAuthorization(_email: string | undefined) {
  const query = useUser();
  return {
    ...query,
    isVehicleAdmin: query.data?.isVehicleAdmin ?? false,
    isMealAdmin: query.data?.isMealAdmin ?? false,
    isITAdmin: query.data?.isITAdmin ?? false,
    isSuperAdmin: query.data?.isSuperAdmin ?? false,
  };
}
