import { useEffect, useState } from 'react';
import { Bell, CheckCheck, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getNotificationText, getNotificationTitle, useDeleteNotification, useDeleteSelectedNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useMarkSelectedNotificationsRead, useUserNotifications, type NotificationStatusFilter, type NotificationTypeFilter, type UserNotification } from '@/hooks/use-inbox';
import { useLanguage } from '@/lib/localization';

function formatNotificationDate(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function NotificationsPage() {
  const { t, locale } = useLanguage();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { data, isPending, isError, error, refetch, isFetching } = useUserNotifications({ page, pageSize, status: statusFilter, type: typeFilter });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const markSelectedRead = useMarkSelectedNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const deleteSelectedNotifications = useDeleteSelectedNotifications();
  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    if (data?.page && data.page !== page) setPage(data.page);
  }, [data?.page, page]);

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

  function toggleSelected(id: number, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((current) => {
      if (!checked) return new Set();
      return new Set(items.map((item) => item.id));
    });
  }

  async function markSelected() {
    try {
      await markSelectedRead.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast.success(t('Notifikasi terpilih ditandai sudah dibaca.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Notifikasi gagal diperbarui.'));
    }
  }

  async function deleteOne(id: number) {
    try {
      await deleteNotification.mutateAsync(id);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      toast.success(t('Notifikasi dihapus.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Notifikasi gagal dihapus.'));
    }
  }

  async function deleteSelected() {
    try {
      await deleteSelectedNotifications.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast.success(t('Notifikasi terpilih dihapus.'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Notifikasi gagal dihapus.'));
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
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t('Notifikasi terbaru')}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={(value: NotificationStatusFilter) => { setStatusFilter(value); setPage(1); }}>
                <SelectTrigger className="w-36" aria-label={t('Filter status notifikasi')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All')}</SelectItem>
                  <SelectItem value="unread">{t('Unread')}</SelectItem>
                  <SelectItem value="read">{t('Read')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(value: NotificationTypeFilter) => { setTypeFilter(value); setPage(1); }}>
                <SelectTrigger className="w-48" aria-label={t('Filter tipe notifikasi')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All')}</SelectItem>
                  <SelectItem value="vehicle">{t('Vehicle Requests')}</SelectItem>
                  <SelectItem value="meal">{t('Extra Meal Requests')}</SelectItem>
                  <SelectItem value="system">{t('System Notifications')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={items.length > 0 && items.every((item) => selectedIds.has(item.id))}
                onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                aria-label={t('Pilih semua notifikasi')}
              />
              {t('Pilih semua')}
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={selectedIds.size === 0 || markSelectedRead.isPending} onClick={() => void markSelected()}><CheckCheck />{t('Tandai pilihan dibaca')}</Button>
              <Button variant="destructive" size="sm" disabled={selectedIds.size === 0 || deleteSelectedNotifications.isPending} onClick={() => void deleteSelected()}><Trash2 />{t('Hapus pilihan')}</Button>
            </div>
          </div>
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
            <>
              <ul className="divide-y">
                {items.map((notification: UserNotification) => (
                  <li key={notification.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <Checkbox
                      checked={selectedIds.has(notification.id)}
                      onCheckedChange={(checked) => toggleSelected(notification.id, checked === true)}
                      aria-label={`${t('Pilih')} ${getNotificationTitle(notification, t)}`}
                    />
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
                      <Button variant="ghost" size="icon" disabled={deleteNotification.isPending} onClick={() => void deleteOne(notification.id)} aria-label={t('Hapus notifikasi')} title={t('Hapus notifikasi')}><Trash2 className="size-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {t('Showing {{start}}-{{end}} of {{total}} notifications', { start: rangeStart, end: rangeEnd, total })}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={String(pageSize)} onValueChange={(value: string) => { setPageSize(Number(value)); setPage(1); }}>
                    <SelectTrigger className="w-32" aria-label={t('Notifikasi per halaman')}><SelectValue /></SelectTrigger>
                    <SelectContent>{[10, 25, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size} {t('notifikasi')}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{t('Sebelumnya')}</Button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1)
                    .map((number) => <Button key={number} variant={number === page ? 'outline' : 'ghost'} size="sm" onClick={() => setPage(number)} aria-current={number === page ? 'page' : undefined}>{number}</Button>)}
                  <Button variant="outline" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>{t('Berikutnya')}</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
