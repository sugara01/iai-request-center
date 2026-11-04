import { useMemo } from 'react';
import { Bell, CarFront, ClipboardList, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMealRequests } from '@/hooks/use-meal-requests';
import { useVehicleRequests } from '@/hooks/use-vehicle-requests';
import { compareNewestSharePointDate } from '@/lib/sharepoint-date';
import { getVehicleRequestNumber } from '@/lib/request-number';
import type { MealRequest } from '@/lib/meal-store';
import type { RequestKendaraan } from '@/generated/models/request-kendaraan-model';

export type AdminNotificationCounts = { vehicle: number; meal: number };
type NotificationItem = { key: string; type: 'vehicle' | 'meal'; requestId: string; requester: string; status: string; createdAt?: string };

function formatCreatedAt(value: string | undefined) {
  if (!value) return 'Waktu tidak tersedia';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}



export function useAdminNotificationCounts(isVehicleAdmin: boolean, isMealAdmin: boolean): AdminNotificationCounts {
  const vehicleQuery = useVehicleRequests(undefined, isVehicleAdmin);
  const mealQuery = useMealRequests(isMealAdmin);
  const vehicle = isVehicleAdmin ? (vehicleQuery.data ?? []).filter((request: RequestKendaraan) => request.currentStatusKey === 'Submitted' || request.currentStatusKey === 'PendingPlantDirectorApproval').length : 0;
  const mealGroups = new Map<string, MealRequest[]>();
  if (isMealAdmin) (mealQuery.data ?? []).forEach((request: MealRequest) => mealGroups.set(request.id, [...(mealGroups.get(request.id) ?? []), request]));
  const meal = Array.from(mealGroups.values()).filter((records: MealRequest[]) => records.some((record: MealRequest) => record.status === 'Submitted') || new Set(records.map((record: MealRequest) => record.status)).size > 1).length;
  return { vehicle, meal };
}

export function AdminNotificationCenter({ isVehicleAdmin, isMealAdmin }: { isVehicleAdmin: boolean; isMealAdmin: boolean }) {
  const navigate = useNavigate();
  const vehicleQuery = useVehicleRequests();
  const mealQuery = useMealRequests();
  const adminItems = useMemo<NotificationItem[]>(() => {
    const vehicleItems: NotificationItem[] = isVehicleAdmin ? (vehicleQuery.data ?? [])
      .filter((request: RequestKendaraan) => request.currentStatusKey === 'Submitted' || request.currentStatusKey === 'PendingPlantDirectorApproval')
      .map((request: RequestKendaraan) => ({ key: `admin-vehicle-${request.id}`, type: 'vehicle', requestId: getVehicleRequestNumber(request), requester: request.namaPemohon ?? 'Pemohon', status: request.currentStatusKey === 'PendingPlantDirectorApproval' ? 'Pending Plant Director Approval' : 'Submitted', createdAt: request.createdDate })) : [];
    const grouped = new Map<string, MealRequest[]>();
    if (isMealAdmin) (mealQuery.data ?? []).forEach((request: MealRequest) => grouped.set(request.id, [...(grouped.get(request.id) ?? []), request]));
    const mealItems: NotificationItem[] = Array.from(grouped.entries()).flatMap(([id, records]: [string, MealRequest[]]) => {
      const statuses = new Set(records.map((record: MealRequest) => record.status));
      if (!records.some((record: MealRequest) => record.status === 'Submitted') && statuses.size === 1) return [];
      const newest = [...records].sort((a: MealRequest, b: MealRequest) => compareNewestSharePointDate(a.createdAt, b.createdAt, a.recordId, b.recordId))[0];
      return [{ key: `admin-meal-${id}`, type: 'meal', requestId: id, requester: newest?.requester ?? 'Pemohon', status: statuses.size > 1 ? 'Status campuran' : 'Submitted', createdAt: newest?.createdAt }];
    });
    return [...vehicleItems, ...mealItems].sort((a: NotificationItem, b: NotificationItem) => compareNewestSharePointDate(a.createdAt, b.createdAt, a.requestId, b.requestId));
  }, [isVehicleAdmin, isMealAdmin, vehicleQuery.data, mealQuery.data]);

  const isLoading = vehicleQuery.isLoading || mealQuery.isLoading;
  const isError = vehicleQuery.isError || mealQuery.isError;
  const total = adminItems.length;
  const openAdminItem = (item: NotificationItem) => navigate(`${item.type === 'vehicle' ? '/admin-kendaraan' : '/admin-meal'}?request=${encodeURIComponent(item.requestId)}`);

  const renderItems = (items: NotificationItem[], onOpen: (item: NotificationItem) => void) => items.map((item: NotificationItem) => {
    const Icon = item.type === 'vehicle' ? CarFront : ClipboardList;
    return <button key={item.key} type="button" className="flex w-full gap-3 border-t p-4 text-left hover:bg-accent hover:text-accent-foreground" onClick={() => onOpen(item)}><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{item.requestId}</span><Badge variant={item.status === 'Rejected' ? 'destructive' : 'secondary'}>{item.status}</Badge></span><span className="mt-1 block text-sm">{item.type === 'vehicle' ? 'Kendaraan' : 'Extra Meal'} • {formatCreatedAt(item.createdAt)}</span></span></button>;
  });

  return <Popover><PopoverTrigger asChild><Button variant="outline" size="icon" className="relative" aria-label={`Notifikasi admin, ${total} perlu diproses`}><Bell className="size-4" />{total > 0 && <Badge className="absolute -right-2 -top-2 min-w-5 justify-center px-1 text-xs">{total > 99 ? '99+' : total}</Badge>}</Button></PopoverTrigger><PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0"><div className="border-b p-4"><p className="font-semibold">Notifikasi Admin</p><p className="text-sm text-muted-foreground">{total} request perlu diproses</p></div><ScrollArea className="max-h-96">{isLoading ? <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Memuat notifikasi...</div> : isError ? <div className="p-6 text-sm text-muted-foreground">Notifikasi gagal dimuat. Silakan refresh halaman.</div> : total === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Tidak ada request yang perlu diproses.</div> : <section><div className="bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">Perlu diproses ({adminItems.length})</div>{renderItems(adminItems, openAdminItem)}</section>}</ScrollArea></PopoverContent></Popover>;
}