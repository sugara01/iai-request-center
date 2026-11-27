import { useState } from 'react';
import { Bell, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMealRequests } from '@/hooks/use-meal-requests';
import { useVehicleRequests } from '@/hooks/use-vehicle-requests';
import type { MealRequest } from '@/lib/meal-store';
import type { RequestKendaraan } from '@/generated/models/request-kendaraan-model';
import { getNotificationText, getNotificationTitle, useMarkNotificationRead, useUserNotifications } from '@/hooks/use-inbox';
import { useLanguage } from '@/lib/localization';

export type AdminNotificationCounts = { vehicle: number; meal: number };

export function useAdminNotificationCounts(isVehicleAdmin: boolean, isMealAdmin: boolean): AdminNotificationCounts {
  const vehicleQuery = useVehicleRequests(undefined, isVehicleAdmin);
  const mealQuery = useMealRequests(isMealAdmin);
  const vehicle = isVehicleAdmin ? (vehicleQuery.data ?? []).filter((request: RequestKendaraan) => request.currentStatusKey === 'Submitted' || request.currentStatusKey === 'PendingPlantDirectorApproval').length : 0;
  const mealGroups = new Map<string, MealRequest[]>();
  if (isMealAdmin) (mealQuery.data ?? []).forEach((request: MealRequest) => mealGroups.set(request.id, [...(mealGroups.get(request.id) ?? []), request]));
  const meal = Array.from(mealGroups.values()).filter((records: MealRequest[]) => records.some((record: MealRequest) => record.status === 'Submitted')).length;
  return { vehicle, meal };
}

export function InboxNotificationBell() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data, isPending, isError } = useUserNotifications({ status: 'unread', pageSize: 8 });
  const markRead = useMarkNotificationRead();
  const notifications = (data?.items ?? []).filter((notification) => !notification.readAt);
  const unreadCount = data?.unreadCount ?? 0;
  const goToNotifications = () => {
    setOpen(false);
    navigate('/inbox/notifications');
  };
  const openNotification = (id: number, readAt?: string) => {
    setOpen(false);
    navigate('/inbox/notifications');
    if (!readAt) {
      void markRead.mutateAsync(id).catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : t('Notifikasi gagal diperbarui.'));
      });
    }
  };
  const formatCreatedAt = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={t('Notifikasi belum dibaca: {{count}}', { count: unreadCount })}>
          <Bell className="size-4" />
          {unreadCount > 0 && <Badge className="absolute -right-2 -top-2 min-w-5 justify-center px-1 text-xs">{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <p className="font-semibold">{t('Notifications')}</p>
            <p className="text-sm text-muted-foreground">{t('{{count}} belum dibaca', { count: unreadCount })}</p>
          </div>
          <Button variant="link" size="sm" onClick={goToNotifications}>{t('Lihat semua')}</Button>
        </div>
        <ScrollArea className="max-h-96">
          {isPending ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />{t('Memuat notifikasi...')}</div>
          ) : isError ? (
            <div className="p-6 text-sm text-muted-foreground">{t('Notifikasi gagal dimuat. Silakan refresh halaman.')}</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t('Tidak ada notifikasi belum dibaca.')}</div>
          ) : notifications.slice(0, 8).map((notification) => (
            <button
              key={notification.id}
              type="button"
              className={`flex w-full gap-3 border-t p-4 text-left hover:bg-accent hover:text-accent-foreground ${notification.readAt ? 'text-muted-foreground' : ''}`}
              onClick={() => openNotification(notification.id, notification.readAt)}
            >
              <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.readAt ? 'bg-muted' : 'bg-primary'}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{getNotificationTitle(notification, t)}</span>
                <span className="mt-1 block text-sm">{getNotificationText(notification, t)}</span>
                <span className="mt-1 block text-xs">{formatCreatedAt(notification.createdAt)}</span>
              </span>
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}