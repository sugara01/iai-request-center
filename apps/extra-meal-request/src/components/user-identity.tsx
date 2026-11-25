import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { AppUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';

function getUserInitials(fullName: string) {
  const parts = fullName.replace(/\([^)]*\)/g, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IA';
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
}

export function UserIdentity({ user, className }: { user: AppUser; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2 rounded-lg border bg-card px-2 py-1 text-left shadow-sm', className)}>
      <Avatar className="size-7 border border-slate-200 bg-slate-950 text-white dark:border-slate-700">
        <AvatarFallback className="bg-[#002b5c] text-xs font-semibold text-white">
          {getUserInitials(user.fullName)}
        </AvatarFallback>
      </Avatar>
      <span className="max-w-40 truncate text-sm font-semibold leading-5">{user.fullName}</span>
    </div>
  );
}
