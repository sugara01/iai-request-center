import { useQuery } from '@tanstack/react-query';
import { initialize } from '@microsoft/power-apps/app';
import { Office365UsersService } from '@/generated/services/Office365UsersService';
import type { User } from '@/generated/models/Office365UsersModel';

const wait = (milliseconds: number) => new Promise<void>((resolve: () => void) => window.setTimeout(resolve, milliseconds));

export function useEntraUsers(searchTerm: string) {
  const normalizedSearch = searchTerm.trim();

  return useQuery({
    queryKey: ['entra-users', normalizedSearch],
    queryFn: async (): Promise<User[]> => {
      await wait(500);
      let lastError: Error | undefined;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await initialize();
          const result = await Office365UsersService.SearchUserV2(normalizedSearch, 10, true, undefined);
          if (!result.success) {
            const connectorMessage = result.error?.message?.trim();
            throw new Error(connectorMessage || 'Pencarian user Entra ID gagal. Periksa koneksi Office 365 Users.');
          }
          return (result.data?.value ?? []).filter((user: User) => Boolean(user.Mail || user.UserPrincipalName));
        } catch (error: unknown) {
          lastError = error instanceof Error ? error : new Error('Pencarian user Entra ID gagal');
          if (attempt < 2) await wait(500 * (2 ** attempt));
        }
      }

      throw lastError ?? new Error('Pencarian user Entra ID gagal');
    },
    enabled: normalizedSearch.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
