import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getNotificationText, getNotificationTitle, useMarkAllNotificationsRead, useMarkNotificationRead, useUserNotifications, type UserNotification } from '@/hooks/use-inbox';
import { useLanguage } from '@/lib/localization';

function formatNotificationDate(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function NotificationsPage() {
  const { t, locale } = useLanguage();
  const { data, isPending, isError, error, refetch, isFetching } = useUserNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  async function markOne(notification: UserNotification) {
    if (notification.readAt) return;
    try {
      await markRead.mutateAsync(notification.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Notifikasi gagal diperbarui.'));
    }
  }

  async function markAll() {
    try {
      await markAllRead.mutateAsync();
      toast.success(t('Semua notifikasi ditandai sudah dibaca.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Notifikasi gagal diperbarui.'));
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('Inbox')}</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><Bell className="size-6" />{t('Notifications')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('{{count}} notifikasi belum dibaca.', { count: unreadCount })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}><RefreshCw className={isFetching ? 'animate-spin' : ''} />{t('Refresh')}</Button>
          <Button variant="outline" onClick={() => void markAll()} disabled={unreadCount === 0 || markAllRead.isPending}><CheckCheck />{t('Tandai semua dibaca')}</Button>
        </div>
      </header>

      <Card className="mt-6">
        <CardHeader><CardTitle>{t('Notifikasi terbaru')}</CardTitle></CardHeader>
        <CardContent>
          {isError ? (
            <div className="rounded-lg border border-destructive p-4 text-sm" role="alert">
              <p className="font-medium">{t('Notifikasi gagal dimuat.')}</p>
              <p className="mt-1 text-muted-foreground">{error instanceof Error ? error.message : t('Silakan coba lagi.')}</p>
            </div>
          ) : isPending ? (
            <div className="space-y-3" aria-hidden="true"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">{t('Tidak ada notifikasi tersedia.')}</div>
          ) : (
            <ul className="divide-y">
              {items.map((notification: UserNotification) => (
                <li key={notification.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={notification.readAt ? getNotificationTitle(notification, t) : `${t('Tandai dibaca')}: ${getNotificationTitle(notification, t)}`}
                    disabled={!notification.readAt && markRead.isPending}
                    onClick={() => void markOne(notification)}
                  >
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.readAt ? 'bg-muted' : 'bg-primary'}`} aria-label={notification.readAt ? t('Sudah dibaca') : t('Belum dibaca')} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{getNotificationTitle(notification, t)}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{getNotificationText(notification, t)}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{formatNotificationDate(notification.createdAt, locale)}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant={notification.readAt ? 'outline' : 'default'}>{notification.readAt ? t('Sudah dibaca') : t('Belum dibaca')}</Badge>
                    {!notification.readAt && <Button variant="outline" size="sm" disabled={markRead.isPending} onClick={() => void markOne(notification)}>{t('Tandai dibaca')}</Button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
