import { useQuery } from '@tanstack/react-query';
import { initialize } from '@microsoft/power-apps/app';
import { Office365UsersService } from '@/generated/services/Office365UsersService';

const wait = (milliseconds: number) => new Promise<void>((resolve: () => void) => {
  window.setTimeout(resolve, milliseconds);
});

export function useRequesterManager(userId?: string) {
  return useQuery({
    queryKey: ['requester-manager', userId],
    queryFn: async () => {
      if (!userId) throw new Error('Identitas requester tidak tersedia.');
      await wait(500);

      let lastError = 'Manager requester tidak ditemukan di Microsoft Entra ID.';
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await initialize();
          const result = await Office365UsersService.Manager_V2(userId, 'id,displayName,mail,userPrincipalName,department,jobTitle');
          if (result.success && result.data) {
            const email = result.data.userPrincipalName ?? result.data.mail;
            if (!email) throw new Error('Akun manager tidak memiliki email atau UPN.');
            return { ...result.data, email };
          }
          lastError = result.error?.message ?? lastError;
        } catch (error: unknown) {
          lastError = error instanceof Error ? error.message : lastError;
        }
        if (attempt < 2) await wait(500 * (2 ** attempt));
      }
      throw new Error(lastError);
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
