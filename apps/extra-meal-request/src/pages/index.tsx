import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CarFront, CheckCircle2, ChevronDown, ChevronRight, Clock3, Eye, Plus, RefreshCw, Search, UtensilsCrossed, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import { type MealRequest } from '@/lib/meal-store';
import { useMealRequests } from '@/hooks/use-meal-requests';
import { useUser } from '@/hooks/use-user';
import { useVehicleRequests } from '@/hooks/use-vehicle-requests';
import { RequestKendaraanCurrentStatusKeyToLabel, type RequestKendaraan } from '@/generated/models/request-kendaraan-model';
import { compareNewestSharePointDate, getSharePointTimestamp } from '@/lib/sharepoint-date';
import { getVehicleDepartmentLabel } from '@/lib/vehicle-department';
import { getVehicleRequestNumber } from '@/lib/request-number';
import { getVehicleDestinationDetail, getVehicleDestinationLabel, getVehicleDestinationSummary } from '@/lib/vehicle-destination';
import { useLanguage } from '@/lib/localization';

type RequestFilter = 'all' | 'processing' | 'approved' | 'rejected';
type DetailItem = { label: string; value: string };
type UnifiedRequest = { id: string; type: 'Kendaraan' | 'Extra Meal'; summary: string; schedule: string; status: string; requester: string; detail: DetailItem[]; createdAt?: string; mealRecords?: MealRequest[] };

const isProcessing = (status: string) => status === 'Submitted' || status === 'Pending Plant Director Approval';
const isRejected = (status: string) => status.includes('Rejected') || status === 'Cancelled';

const formatWelcomeName = (fullName: string | undefined, fallback: string) => {
  const normalizedName = fullName?.trim();
  if (!normalizedName) return fallback;

  const [lastName, ...firstNameParts] = normalizedName.split(',').map((part: string) => part.trim());
  const firstName = firstNameParts.filter(Boolean).join(' ');
  return firstName && lastName ? `${firstName} ${lastName}` : normalizedName;
};

export default function HomePage() {
  const { locale, t } = useLanguage();
  const { data: mealRequests = [], isLoading: isMealsLoading, refetch: refetchMeals, isFetching: isMealsFetching, dataUpdatedAt: mealsUpdatedAt } = useMealRequests();
  const { data: user } = useUser();
  const { data: vehicleRequests = [], isLoading: isVehiclesLoading, refetch: refetchVehicles, isFetching: isVehiclesFetching, dataUpdatedAt: vehiclesUpdatedAt } = useVehicleRequests();
  const [filter, setFilter] = useState<RequestFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<UnifiedRequest>();
  const [searchParams, setSearchParams] = useSearchParams();
  const processedDeepLink = useRef<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const email = user?.userPrincipalName ?? 'ayu.lestari@example.com';
  const meals = mealRequests.filter((request: MealRequest) => request.requesterEmail.toLowerCase() === email.toLowerCase());
  const vehicles = vehicleRequests.filter((request: RequestKendaraan) => request.emailPemohon?.toLowerCase() === email.toLowerCase());

  const unified = useMemo<UnifiedRequest[]>(() => {
    const vehicleItems = vehicles.map((request: RequestKendaraan) => {
      const destinationDetail = getVehicleDestinationDetail(request);
      const status = request.currentStatusKey ? RequestKendaraanCurrentStatusKeyToLabel[request.currentStatusKey] : 'Submitted';
      return { id: getVehicleRequestNumber(request), type: 'Kendaraan' as const, summary: getVehicleDestinationSummary(request), schedule: `${request.tanggal ?? '-'} ${request.jam ?? ''}`.trim(), status, requester: request.namaPemohon ?? user?.fullName ?? 'IAI User', createdAt: request.created ?? request.createdDate, detail: [{ label: 'Tujuan', value: getVehicleDestinationLabel(request) }, ...(destinationDetail ? [{ label: 'Detail Tujuan lainnya', value: destinationDetail }] : []), { label: 'Titik jemput', value: request.titikJemput ?? '-' }, { label: 'Departemen', value: getVehicleDepartmentLabel(request.departemenKey) }, { label: 'Jumlah penumpang', value: request.jumlahPenumpang ?? '-' }, { label: t('Keperluan'), value: request.keperluan ?? '-' }, { label: t('Catatan requester'), value: request.catatan ?? '-' }, { label: t('Catatan admin'), value: request.adminNote ?? '-' }, { label: t('Catatan Plant Director'), value: request.plantDirectorNote ?? '-' }] };
    });
    const grouped = new Map<string, MealRequest[]>();
    meals.forEach((request: MealRequest) => grouped.set(request.id, [...(grouped.get(request.id) ?? []), request]));
    const mealItems = Array.from(grouped.entries()).map(([id, records]: [string, MealRequest[]]) => {
      const sorted = [...records].sort((a: MealRequest, b: MealRequest) => a.serviceDate.localeCompare(b.serviceDate));
      const first = sorted[0];
      const statuses = Array.from(new Set(sorted.map((record: MealRequest) => record.status)));
      const newestCreatedAt = [...sorted].sort((a: MealRequest, b: MealRequest) =>
        compareNewestSharePointDate(a.createdAt, b.createdAt, a.sharePointId ?? a.recordId, b.sharePointId ?? b.recordId),
      )[0]?.createdAt;
      const createdDisplay = getSharePointTimestamp(newestCreatedAt) === undefined
        ? (newestCreatedAt || '-')
        : new Date(getSharePointTimestamp(newestCreatedAt) as number).toLocaleString(locale);
      return { id, type: 'Extra Meal' as const, summary: first.purpose, schedule: `${first.startDate} — ${first.endDate}`, status: statuses.length === 1 ? statuses[0] : t('Status campuran'), requester: first.requester, createdAt: newestCreatedAt, mealRecords: sorted, detail: [{ label: 'Departemen', value: first.department }, { label: t('Jumlah tanggal'), value: String(sorted.length) }, { label: 'Kategori meal', value: first.mealCategory }, { label: 'Jumlah per hari', value: String(first.quantity) }, { label: t('Catatan atau Tambahan dari requester'), value: first.additional || '-' }, { label: 'Dibuat pada', value: createdDisplay }] };
    });
    return [...vehicleItems, ...mealItems].sort((a: UnifiedRequest, b: UnifiedRequest) =>
      compareNewestSharePointDate(a.createdAt, b.createdAt, a.id, b.id),
    );
  }, [vehicles, meals, user?.fullName, t, locale]);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return unified.filter((request: UnifiedRequest) => {
      const dailySearch = request.mealRecords?.map((record: MealRequest) => `${record.recordId} ${record.serviceDate} ${record.mealCategory} ${record.status}`).join(' ') ?? '';
      const matchesFilter = filter === 'all' || (filter === 'processing' && (isProcessing(request.status) || request.mealRecords?.some((record: MealRequest) => isProcessing(record.status)))) || (filter === 'approved' && (request.status === 'Approved' || request.mealRecords?.some((record: MealRequest) => record.status === 'Approved'))) || (filter === 'rejected' && (isRejected(request.status) || request.mealRecords?.some((record: MealRequest) => isRejected(record.status))));
      return Boolean(matchesFilter && (!normalizedQuery || `${request.id} ${request.type} ${request.summary} ${request.schedule} ${request.status} ${dailySearch}`.toLowerCase().includes(normalizedQuery)));
    });
  }, [unified, filter, query]);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const pagedRequests = visible.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = visible.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, visible.length);
  useEffect(() => {
    const requestId = searchParams.get('request');
    const requestType = searchParams.get('type');
    if (!requestId) {
      processedDeepLink.current = undefined;
      return;
    }
    const deepLinkKey = `${requestType ?? 'all'}:${requestId}`;
    if (processedDeepLink.current === deepLinkKey) return;
    const match = unified.find((request: UnifiedRequest) => request.id === requestId && (!requestType || (requestType === 'vehicle' ? request.type === 'Kendaraan' : request.type === 'Extra Meal')));
    if (!match) return;
    processedDeepLink.current = deepLinkKey;
    setSearchParams({}, { replace: true });
    setSelected(match);
  }, [searchParams, setSearchParams, unified]);


  useEffect(() => {
    setPage(1);
  }, [mealsUpdatedAt, vehiclesUpdatedAt]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const stats = [{ label: t('Total request'), value: unified.length, icon: Clock3, filter: 'all' as const }, { label: t('Sedang diproses'), value: unified.filter((item: UnifiedRequest) => isProcessing(item.status)).length, icon: Clock3, filter: 'processing' as const }, { label: 'Approved', value: unified.filter((item: UnifiedRequest) => item.status === 'Approved').length, icon: CheckCircle2, filter: 'approved' as const }, { label: 'Rejected / Cancelled', value: unified.filter((item: UnifiedRequest) => isRejected(item.status)).length, icon: XCircle, filter: 'rejected' as const }];
  const openWithKeyboard = (event: KeyboardEvent<HTMLTableRowElement>, request: UnifiedRequest) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(request); } };
  const toggle = (id: string) => setExpanded((current: Set<string>) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const openDailyDetail = (group: UnifiedRequest, record: MealRequest) => {
    const duration = record.durationHours ? `${record.durationHours} ${t('jam')}` : `${group.mealRecords?.length ?? 1} ${t('hari kalender')}`;
    setSelected({ ...group, status: record.status, schedule: record.serviceDate, detail: [{ label: 'Record ID', value: record.recordId }, { label: 'Tanggal layanan', value: record.serviceDate }, { label: t('Durasi'), value: duration }, { label: 'Departemen', value: record.department }, { label: 'Kategori meal', value: record.mealCategory }, { label: 'Jumlah', value: String(record.quantity) }, { label: t('Catatan atau Tambahan dari requester'), value: record.additional || '-' }] });
  };

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">{t('Dashboard requester')}</p><h1 className="mt-1 text-2xl font-bold">{t('Selamat Datang, {{name}}', { name: formatWelcomeName(user?.fullName, locale === 'id-ID' ? 'Pengguna' : 'User') })}</h1><p className="mt-1 text-sm text-muted-foreground">{t('Pantau seluruh request kendaraan dan extra meal dalam satu tempat.')}</p><p className="mt-2 text-xs text-muted-foreground">Sinkron otomatis setiap 15 detik • terakhir diperbarui {new Date(Math.max(mealsUpdatedAt, vehiclesUpdatedAt) || Date.now()).toLocaleTimeString(locale)}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => { void refetchVehicles(); void refetchMeals(); }} disabled={isVehiclesFetching || isMealsFetching}><RefreshCw className={isVehiclesFetching || isMealsFetching ? 'animate-spin' : ''} />{t('Refresh')}</Button><Button asChild><Link to="/buat-request"><Plus />{t('Buat Request')}</Link></Button></div></header>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t('Filter status request')}>{stats.map(({ label, value, icon: Icon, filter: statFilter }) => <button key={label} type="button" className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setFilter(statFilter); setPage(1); }} aria-pressed={filter === statFilter}><Card className={filter === statFilter ? 'border-primary shadow-sm' : 'transition-colors hover:border-primary'}><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div><div className={filter === statFilter ? 'grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground' : 'grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground'}><Icon className="size-5" /></div></CardContent></Card></button>)}</section>
      <Card className="mt-6"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{t('Request saya')}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{visible.length} {t('dari')} {unified.length} {t('pengajuan')}</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 size-4" /><Input className="pl-9" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setPage(1); }} placeholder={t('Cari ID, jenis, tujuan, status')} aria-label={t('Cari request')} /></div></div></CardHeader>
        <CardContent>{isVehiclesLoading || isMealsLoading ? <div className="space-y-3" aria-hidden="true"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : visible.length === 0 ? <div className="rounded-lg border border-dashed p-10 text-center"><p className="font-medium">{t('Request tidak ditemukan')}</p><p className="mt-1 text-sm text-muted-foreground">{t('Ubah kata pencarian atau pilih kategori status lain.')}</p></div> : <>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1040px] table-fixed"><TableHeader><TableRow><TableHead className="w-12" /><TableHead className="w-40">Request ID</TableHead><TableHead className="w-36">{t('Jenis')}</TableHead><TableHead className="w-72">{t('Tujuan / acara')}</TableHead><TableHead className="w-48">{t('Jadwal')}</TableHead><TableHead className="w-48">Status</TableHead><TableHead className="w-28 text-right">{t('Detail')}</TableHead></TableRow></TableHeader><TableBody>
              {pagedRequests.map((request: UnifiedRequest) => { const isMeal = request.type === 'Extra Meal'; const isOpen = expanded.has(request.id); return <Fragment key={`${request.type}-${request.id}`}><TableRow className={isMeal ? 'cursor-pointer bg-muted text-muted-foreground' : 'cursor-pointer'} tabIndex={0} onClick={() => isMeal ? toggle(request.id) : setSelected(request)} onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => isMeal ? undefined : openWithKeyboard(event, request)}><TableCell>{isMeal && <Button variant="ghost" size="icon-sm" aria-label={isOpen ? t('Tutup grup') : t('Buka grup')}>{isOpen ? <ChevronDown /> : <ChevronRight />}</Button>}</TableCell><TableCell className="font-medium text-foreground">{request.id}</TableCell><TableCell><Badge variant="outline"><span className="flex items-center gap-1.5">{isMeal ? <UtensilsCrossed className="size-3.5" /> : <CarFront className="size-3.5" />}{request.type}</span></Badge></TableCell><TableCell className="whitespace-normal break-words align-top">{request.summary}</TableCell><TableCell>{request.schedule}</TableCell><TableCell>{request.status === t('Status campuran') ? <Badge variant="outline">{request.status}</Badge> : <StatusBadge status={request.status} />}</TableCell><TableCell className="text-right">{isMeal ? <Badge variant="secondary">{request.mealRecords?.length ?? 0} {t('tanggal')}</Badge> : <Button variant="ghost" size="icon-sm" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); setSelected(request); }} aria-label={`${t('Lihat detail')} ${request.id}`}><Eye /></Button>}</TableCell></TableRow>
                {isMeal && isOpen && request.mealRecords?.map((record: MealRequest) => <TableRow key={record.recordId} className="bg-card text-card-foreground"><TableCell /><TableCell><span className="text-xs text-muted-foreground">{record.recordId}</span></TableCell><TableCell colSpan={2}><span className="font-medium">{record.serviceDate}</span><span className="ml-3 text-sm text-muted-foreground">{record.mealCategory} • {record.quantity} meal</span></TableCell><TableCell>{t('Detail harian')}</TableCell><TableCell><StatusBadge status={record.status} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon-sm" aria-label={`${t('Lihat detail')} ${record.serviceDate}`} onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); openDailyDetail(request, record); }}><Eye /></Button></TableCell></TableRow>)}</Fragment>; })}
            </TableBody></Table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">{t('Menampilkan')} {rangeStart}–{rangeEnd} {t('dari')} {visible.length} {t('hasil')}</p><div className="flex flex-wrap items-center gap-2"><Select value={String(pageSize)} onValueChange={(value: string) => { setPageSize(Number(value)); setPage(1); }}><SelectTrigger className="w-32" aria-label={t('Baris per halaman')}><SelectValue /></SelectTrigger><SelectContent>{[10, 50, 100, 500].map((size: number) => <SelectItem key={size} value={String(size)}>{size} {t('baris')}</SelectItem>)}</SelectContent></Select><span className="text-sm text-foreground">{t('Halaman')} {page} {t('dari')} {pageCount}</span><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current: number) => Math.max(1, current - 1))}>{t('Sebelumnya')}</Button><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current: number) => Math.min(pageCount, current + 1))}>{t('Berikutnya')}</Button></div></div>
        </>}</CardContent></Card>
      <Sheet open={Boolean(selected)} onOpenChange={(open: boolean) => !open && setSelected(undefined)}><SheetContent className="overflow-y-auto sm:max-w-lg">{selected && <><SheetHeader className="border-b"><div className="mb-2 flex items-center gap-2"><Badge variant="outline">{selected.type}</Badge><StatusBadge status={selected.status} /></div><SheetTitle>{selected.id}</SheetTitle><SheetDescription>{selected.summary}</SheetDescription></SheetHeader><div className="space-y-6 px-4 pb-6"><section><h3 className="text-sm font-semibold">{t('Ringkasan request')}</h3><dl className="mt-3 divide-y rounded-lg border"><DetailRow label="Requester" value={selected.requester} /><DetailRow label={t('Jadwal')} value={selected.schedule} /><DetailRow label="Status" value={selected.status} /></dl></section><section><h3 className="text-sm font-semibold">{t('Informasi detail')}</h3><dl className="mt-3 divide-y rounded-lg border">{selected.detail.map((item: DetailItem) => <DetailRow key={item.label} label={item.label} value={item.value} />)}</dl></section></div></>}</SheetContent></Sheet>
    </div>
  );
}

function DetailRow({ label, value }: DetailItem) { return <div className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{value}</dd></div>; }
