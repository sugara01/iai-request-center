import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { AlertCircle, ArrowDownAZ, ArrowUpZA, Download, Eye, Pencil, RefreshCw, Search, Trash2, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ActionIconButton } from '@/components/action-icon-button';
import { AdminAnalyticsDashboard, isInAdminPeriod, type AdminPeriod, type AdminStatusFilter } from '@/components/admin-analytics-dashboard';
import { useDeleteVehicleRequest, useUpdateVehicleRequest, useVehicleRequests } from '@/hooks/use-vehicle-requests';
import { RequestKendaraanAdminDecisionKeyToLabel, RequestKendaraanCurrentStatusKeyToLabel, RequestKendaraanPlantDirectorDecisionKeyToLabel, RequestKendaraanTujuanKeyToLabel, type RequestKendaraan, type RequestKendaraanAdminDecisionKey, type RequestKendaraanCurrentStatusKey, type RequestKendaraanPlantDirectorDecisionKey, type RequestKendaraanTujuanKey } from '@/generated/models/request-kendaraan-model';
import { compareNewestSharePointDate } from '@/lib/sharepoint-date';
import { getVehicleDepartmentLabel } from '@/lib/vehicle-department';
import { getVehicleRequestNumber } from '@/lib/request-number';
import { getVehicleDestinationDetail, getVehicleDestinationLabel } from '@/lib/vehicle-destination';
import { useLanguage } from '@/lib/localization';

type DetailItem = { label: string; value: string | undefined };
type SortField = 'requestId' | 'requester';
type SortDirection = 'asc' | 'desc';

function deriveApprovalStatus(request: RequestKendaraan): RequestKendaraanCurrentStatusKey | undefined {
  if (request.adminDecisionKey === 'NotAvailable') return 'RejectedVehicleNotAvailable';
  if (request.adminDecisionKey !== 'Available') return request.currentStatusKey;
  if (request.plantDirectorDecisionKey === 'Approved') return 'Approved';
  if (request.plantDirectorDecisionKey === 'Rejected') return 'RejectedPlantDirector';
  return 'PendingPlantDirectorApproval';
}

function DetailSection({ title, items }: { title: string; items: DetailItem[] }) {
  return <section className="rounded-lg border bg-card p-4 text-card-foreground"><h3 className="mb-3 text-sm font-semibold">{title}</h3><dl className="grid gap-3 sm:grid-cols-2">{items.map((item: DetailItem) => <div key={item.label} className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{item.label}</dt><dd className="mt-1 break-words text-sm">{item.value?.trim() || '-'}</dd></div>)}</dl></section>;
}

function TextField({ label, value, onChange }: { label: string; value: string | undefined; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Input value={value ?? ''} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} /></div>;
}

function TextAreaField({ label, value, onChange, disabled = false }: { label: string; value: string | undefined; onChange: (value: string) => void; disabled?: boolean }) {
  return <div className="space-y-2 sm:col-span-2"><Label>{label}</Label><Textarea value={value ?? ''} disabled={disabled} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)} /></div>;
}

export default function VehicleAdminContent() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: requests = [], isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useVehicleRequests();
  const updateRequest = useUpdateVehicleRequest();
  const deleteRequest = useDeleteVehicleRequest();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<RequestKendaraan>();
  const [editing, setEditing] = useState<RequestKendaraan>();
  const [cancelling, setCancelling] = useState<RequestKendaraan>();
  const [deleting, setDeleting] = useState<RequestKendaraan>();
  const [period, setPeriod] = useState<AdminPeriod>('30d');
  const [dashboardFilter, setDashboardFilter] = useState<AdminStatusFilter>('all');
  const updatedAt = new Date(dataUpdatedAt || Date.now());
  const statusLabel = (request: RequestKendaraan) => request.currentStatusKey ? RequestKendaraanCurrentStatusKeyToLabel[request.currentStatusKey] : 'Submitted';
  const isFinalStatus = (request: RequestKendaraan) => {
    const label = statusLabel(request);
    return label === 'Approved' || label.includes('Rejected') || label === 'Cancelled';
  };
  const isRejected = (request: RequestKendaraan) => statusLabel(request).includes('Rejected') || statusLabel(request) === 'Cancelled';
  const periodRequests = useMemo(() => requests.filter((request: RequestKendaraan) => isInAdminPeriod(request.created ?? request.createdDate, period)), [requests, period]);
  const visible = useMemo(() => {
    const filtered = periodRequests.filter((request: RequestKendaraan) => {
      const label = statusLabel(request);
      const matchesDashboard = dashboardFilter === 'all' || (dashboardFilter === 'processing' && label !== 'Approved' && !label.includes('Rejected') && label !== 'Cancelled') || (dashboardFilter === 'approved' && label === 'Approved') || (dashboardFilter === 'rejected' && (label.includes('Rejected') || label === 'Cancelled'));
      return matchesDashboard && (status === 'all' || request.currentStatusKey === status) && `${getVehicleRequestNumber(request)} ${request.namaPemohon} ${request.emailPemohon} ${getVehicleDepartmentLabel(request.departemenKey)} ${getVehicleDestinationLabel(request)} ${getVehicleDestinationDetail(request) ?? ''}`.toLowerCase().includes(query.toLowerCase());
    });
    return [...filtered].sort((a: RequestKendaraan, b: RequestKendaraan) => {
      if (sortField) {
        const first = sortField === 'requestId' ? getVehicleRequestNumber(a) : (a.namaPemohon ?? '');
        const second = sortField === 'requestId' ? getVehicleRequestNumber(b) : (b.namaPemohon ?? '');
        const comparison = first.localeCompare(second, 'id', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      return compareNewestSharePointDate(
        a.created ?? a.createdDate,
        b.created ?? b.createdDate,
        a.id,
        b.id,
      );
    });
  }, [periodRequests, query, status, dashboardFilter, sortField, sortDirection]);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const pagedRequests = visible.slice((page - 1) * pageSize, page * pageSize);
  const dashboardCounts = { all: periodRequests.length, processing: periodRequests.filter((request: RequestKendaraan) => statusLabel(request) !== 'Approved' && !isRejected(request)).length, approved: periodRequests.filter((request: RequestKendaraan) => statusLabel(request) === 'Approved').length, rejected: periodRequests.filter((request: RequestKendaraan) => isRejected(request)).length };
  const distribution = Object.entries(periodRequests.reduce<Record<string, number>>((acc: Record<string, number>, request: RequestKendaraan) => { const label = statusLabel(request); acc[label] = (acc[label] ?? 0) + 1; return acc; }, {})).map(([label, total]: [string, number]) => ({ label, total }));
  const activeRequests = periodRequests.filter((request: RequestKendaraan) => statusLabel(request) !== 'Approved' && !isRejected(request)).sort((a: RequestKendaraan, b: RequestKendaraan) => (Date.parse(a.created ?? a.createdDate ?? '') || 0) - (Date.parse(b.created ?? b.createdDate ?? '') || 0));
  const nearestTrip = [...activeRequests].filter((request: RequestKendaraan) => Date.parse(request.tanggal ?? '') >= Date.now()).sort((a: RequestKendaraan, b: RequestKendaraan) => Date.parse(a.tanggal ?? '') - Date.parse(b.tanggal ?? ''))[0];
  useEffect(() => {
    setPage(1);
  }, [dataUpdatedAt]);

  useEffect(() => {
    const target = searchParams.get('request');
    if (!target || isLoading) return;
    const match = requests.find((request: RequestKendaraan) => getVehicleRequestNumber(request) === target || String(request.id) === target);
    setSearchParams({}, { replace: true });
    if (!match || isFinalStatus(match)) { toast.info(match ? `Request ${target} sudah tidak memerlukan tindakan.` : `Request ${target} tidak ditemukan.`); return; }
    setEditing({ ...match });
  }, [isLoading, requests, searchParams, setSearchParams]);

  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  function changeSort(field: SortField) { if (sortField === field) setSortDirection((current: SortDirection) => current === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } setPage(1); }
  function stop(event: MouseEvent<HTMLButtonElement>) { event.stopPropagation(); }
  async function saveEdit() {
    if (!editing?.id) return;
    const persisted = requests.find((request: RequestKendaraan) => request.id === editing.id);
    if (!persisted) { toast.error('Data request terbaru tidak ditemukan. Silakan refresh dan coba lagi.'); return; }
    const persistedIsFinal = isFinalStatus(persisted);
    const adminStageOpen = !persistedIsFinal && persisted.adminDecisionKey !== 'Available' && persisted.adminDecisionKey !== 'NotAvailable';
    const directorStageOpen = !persistedIsFinal && persisted.adminDecisionKey === 'Available' && !persisted.plantDirectorDecisionKey;
    const changedFields: Partial<Omit<RequestKendaraan, 'id'>> = {
      tanggal: editing.tanggal,
      jam: editing.jam,
      tujuanKey: editing.tujuanKey,
      tujuanLainnyaDet: editing.tujuanLainnyaDet,
      jumlahPenumpang: editing.jumlahPenumpang,
      titikJemput: editing.titikJemput,
      keperluan: editing.keperluan,
      lastUpdate: new Date().toISOString(),
    };
    if (adminStageOpen) {
      if (editing.adminDecisionKey !== 'Available' && editing.adminDecisionKey !== 'NotAvailable') { toast.error('Pilih keputusan Admin Kendaraan sebelum menyimpan.'); return; }
      changedFields.adminDecisionKey = editing.adminDecisionKey;
      changedFields.adminNote = editing.adminNote;
      changedFields.currentStatusKey = editing.adminDecisionKey === 'Available' ? 'PendingPlantDirectorApproval' : 'RejectedVehicleNotAvailable';
    } else if (directorStageOpen) {
      if (editing.plantDirectorDecisionKey !== 'Approved' && editing.plantDirectorDecisionKey !== 'Rejected') { toast.error('Pilih keputusan Plant Director sebelum menyimpan.'); return; }
      changedFields.plantDirectorDecisionKey = editing.plantDirectorDecisionKey;
      changedFields.plantDirectorNote = editing.plantDirectorNote;
      changedFields.currentStatusKey = editing.plantDirectorDecisionKey === 'Approved' ? 'Approved' : 'RejectedPlantDirector';
    }
    try {
      await updateRequest.mutateAsync({ id: String(editing.id), changedFields });
      toast.success(`Request ${getVehicleRequestNumber(editing)} berhasil diperbarui.`);
      setEditing(undefined);
    } catch (saveError: unknown) {
      toast.error(saveError instanceof Error ? saveError.message : 'Request gagal diperbarui.');
    }
  }
  async function confirmCancel() {
    if (!cancelling?.id) return;
    if (isFinalStatus(cancelling)) {
      toast.error(`Request ${getVehicleRequestNumber(cancelling)} sudah berstatus final dan tidak dapat dibatalkan.`);
      setCancelling(undefined);
      return;
    }
    try {
      await updateRequest.mutateAsync({ id: String(cancelling.id), changedFields: { currentStatusKey: 'Cancelled', lastUpdate: new Date().toISOString() } });
      toast.warning(`Request ${getVehicleRequestNumber(cancelling)} dibatalkan.`);
      setCancelling(undefined);
    } catch (cancelError: unknown) {
      toast.error(cancelError instanceof Error ? cancelError.message : 'Request gagal dibatalkan.');
    }
  }
  async function confirmDelete() {
    if (!deleting?.id) return;
    try { await deleteRequest.mutateAsync(String(deleting.id)); toast.success(`Request ${getVehicleRequestNumber(deleting)} berhasil dihapus.`); setDeleting(undefined); } catch (deleteError: unknown) { toast.error(deleteError instanceof Error ? deleteError.message : 'Request gagal dihapus.'); }
  }
  function exportCsv() {
    const rows = [['SharePoint ID','Request ID','Nama Pemohon','Email Pemohon','Departemen','Tanggal','Jam','Tujuan','Detail Tujuan Lainnya','Keperluan','Catatan requester','Jumlah Penumpang','Titik Jemput','Status Saat Ini','Keputusan Admin','Catatan Admin','Keputusan Plant Director','Catatan Plant Director','Created','Created Date','Last Update'], ...visible.map((request: RequestKendaraan) => [String(request.id), getVehicleRequestNumber(request), request.namaPemohon ?? '', request.emailPemohon ?? '', getVehicleDepartmentLabel(request.departemenKey), request.tanggal ?? '', request.jam ?? '', getVehicleDestinationLabel(request), getVehicleDestinationDetail(request) ?? '', request.keperluan ?? '', request.catatan ?? '', request.jumlahPenumpang ?? '', request.titikJemput ?? '', statusLabel(request), request.adminDecisionKey ? RequestKendaraanAdminDecisionKeyToLabel[request.adminDecisionKey] : '', request.adminNote ?? '', request.plantDirectorDecisionKey ? RequestKendaraanPlantDirectorDecisionKeyToLabel[request.plantDirectorDecisionKey] : '', request.plantDirectorNote ?? '', request.created ?? '', request.createdDate ?? '', request.lastUpdate ?? ''])];
    const content = `\uFEFF${rows.map((row: string[]) => row.map((cell: string) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'request-kendaraan-sesuai-view.csv'; link.click(); URL.revokeObjectURL(url); toast.success(t('{{count}} data kendaraan sesuai view berhasil diekspor.', { count: visible.length }));
  }
  const details = selected ? [{ title: 'Identitas request', items: [{ label: 'ID request', value: getVehicleRequestNumber(selected) }, { label: 'ID record SharePoint', value: String(selected.id) }] }, { title: 'Requester', items: [{ label: 'Nama pemohon', value: selected.namaPemohon }, { label: 'Email pemohon', value: selected.emailPemohon }, { label: 'Departemen', value: getVehicleDepartmentLabel(selected.departemenKey) }] }, { title: 'Perjalanan', items: [{ label: 'Tanggal keberangkatan', value: selected.tanggal }, { label: 'Jam keberangkatan', value: selected.jam }, { label: 'Tujuan', value: getVehicleDestinationLabel(selected) }, { label: 'Detail tujuan lainnya', value: getVehicleDestinationDetail(selected) }, { label: 'Keperluan', value: selected.keperluan }, { label: 'Catatan requester', value: selected.catatan }, { label: 'Jumlah penumpang', value: selected.jumlahPenumpang }, { label: 'Titik jemput', value: selected.titikJemput }] }, { title: 'Status dan keputusan', items: [{ label: 'Status saat ini', value: statusLabel(selected) }, { label: 'Keputusan admin', value: selected.adminDecisionKey ? RequestKendaraanAdminDecisionKeyToLabel[selected.adminDecisionKey] : undefined }, { label: 'Catatan admin', value: selected.adminNote }, { label: 'Keputusan Plant Director', value: selected.plantDirectorDecisionKey ? RequestKendaraanPlantDirectorDecisionKeyToLabel[selected.plantDirectorDecisionKey] : undefined }, { label: 'Catatan Plant Director', value: selected.plantDirectorNote }] }] : [];

  return <div className="p-6 lg:p-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Admin owner kendaraan</p><h1 className="mt-1 text-2xl font-bold">Monitoring kendaraan</h1><p className="mt-1 text-sm text-muted-foreground">Kelola data operasional dan status approval Request kendaraan</p><p className="mt-2 text-xs text-muted-foreground">Sinkron otomatis setiap 15 detik • terakhir diperbarui {updatedAt.toLocaleTimeString('id-ID')}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void refetch().then(() => toast.success('Data kendaraan diperbarui.'))} disabled={isFetching}><RefreshCw className={isFetching ? 'animate-spin' : ''} />Refresh</Button><Button variant="outline" onClick={exportCsv} disabled={requests.length === 0}><Download />Ekspor CSV</Button></div></header>
    {isError && <section className="mt-6 flex items-start gap-3 rounded-lg border border-destructive bg-card p-4 text-card-foreground" role="alert"><AlertCircle className="size-5" /><div><p className="font-semibold">Data kendaraan gagal dimuat</p><p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Koneksi SharePoint tidak tersedia.'}</p></div></section>}
    <AdminAnalyticsDashboard period={period} onPeriodChange={(value: AdminPeriod) => { setPeriod(value); setPage(1); }} statusFilter={dashboardFilter} onStatusFilterChange={(value: AdminStatusFilter) => { setDashboardFilter(value); setPage(1); }} counts={dashboardCounts} indicators={[{ label: 'Menunggu keputusan admin', value: periodRequests.filter((request: RequestKendaraan) => statusLabel(request) === 'Submitted').length }, { label: 'Menunggu Plant Director', value: periodRequests.filter((request: RequestKendaraan) => statusLabel(request).includes('Plant Director')).length }, { label: 'Dibatalkan', value: periodRequests.filter((request: RequestKendaraan) => statusLabel(request) === 'Cancelled').length }, { label: 'Keberangkatan terdekat', value: nearestTrip?.tanggal ?? '-' }]} distribution={distribution} attention={activeRequests.slice(0, 5).map((request: RequestKendaraan) => ({ id: getVehicleRequestNumber(request), title: `${getVehicleRequestNumber(request)} • ${request.namaPemohon ?? 'Pemohon'}`, detail: `${statusLabel(request)} • ${request.tanggal ?? '-'}`, onOpen: () => setSelected(request) }))} updatedAt={updatedAt} />
    <Card className="mt-6"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Request kendaraan</CardTitle><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 size-4" /><Input className="pl-9" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari request" /></div><Select value={status} onValueChange={(value: string) => { setStatus(value); setPage(1); }}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{Object.entries(RequestKendaraanCurrentStatusKeyToLabel).filter(([key]: [string, string]) => Boolean(key)).map(([key, label]: [string, string]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div></div></CardHeader><CardContent>{isLoading ? <div className="space-y-3" aria-hidden="true"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : <><div className="w-full overflow-x-auto"><Table className="min-w-[1120px] table-fixed"><TableHeader><TableRow><TableHead className="w-36"><Button variant="ghost" size="sm" onClick={() => changeSort('requestId')}>ID {sortField === 'requestId' && sortDirection === 'desc' ? <ArrowUpZA /> : <ArrowDownAZ />}</Button></TableHead><TableHead className="w-48"><Button variant="ghost" size="sm" onClick={() => changeSort('requester')}>Pemohon {sortField === 'requester' && sortDirection === 'desc' ? <ArrowUpZA /> : <ArrowDownAZ />}</Button></TableHead><TableHead className="w-72">Tujuan</TableHead><TableHead className="w-44">Jadwal</TableHead><TableHead className="w-28">Penumpang</TableHead><TableHead className="w-56">Status</TableHead><TableHead className="w-48 text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{pagedRequests.map((request: RequestKendaraan) => <TableRow key={request.id} tabIndex={0} className="cursor-pointer" onClick={() => setSelected(request)} onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => { if (event.key === 'Enter') setSelected(request); }}><TableCell className="font-medium">{getVehicleRequestNumber(request)}</TableCell><TableCell className="whitespace-normal break-words">{request.namaPemohon}</TableCell><TableCell className="whitespace-normal break-words align-top">{getVehicleDestinationDetail(request) ?? getVehicleDestinationLabel(request)}</TableCell><TableCell>{request.tanggal ?? '-'} {request.jam ?? ''}</TableCell><TableCell>{request.jumlahPenumpang}</TableCell><TableCell><Badge variant={statusLabel(request) === 'Approved' ? 'default' : isRejected(request) ? 'destructive' : 'secondary'}>{statusLabel(request)}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><ActionIconButton label="Lihat detail" icon={Eye} onClick={(event: MouseEvent<HTMLButtonElement>) => { stop(event); setSelected(request); }} /><ActionIconButton label={t('Koreksi & Approval Request')} icon={Pencil} onClick={(event: MouseEvent<HTMLButtonElement>) => { stop(event); setEditing({ ...request }); }} /><ActionIconButton label={isFinalStatus(request) ? "Request berstatus final dan tidak dapat dibatalkan" : "Batalkan request"} icon={XCircle} disabled={isFinalStatus(request)} onClick={(event: MouseEvent<HTMLButtonElement>) => { stop(event); if (!isFinalStatus(request)) setCancelling(request); }} /><ActionIconButton label="Hapus request" icon={Trash2} onClick={(event: MouseEvent<HTMLButtonElement>) => { stop(event); setDeleting(request); }} /></div></TableCell></TableRow>)}</TableBody></Table></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">{visible.length} hasil</p><div className="flex items-center gap-2"><Select value={String(pageSize)} onValueChange={(value: string) => { setPageSize(Number(value)); setPage(1); }}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{[10,50,100,500].map((size: number) => <SelectItem key={size} value={String(size)}>{size} baris</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current: number) => current - 1)}>Sebelumnya</Button><span className="text-sm">{page}/{pageCount}</span><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current: number) => current + 1)}>Berikutnya</Button></div></div></>}</CardContent></Card>
    <Sheet open={Boolean(selected)} onOpenChange={(open: boolean) => !open && setSelected(undefined)}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader className="border-b"><SheetTitle>Detail request kendaraan</SheetTitle><SheetDescription>{selected ? getVehicleRequestNumber(selected) : ''}</SheetDescription></SheetHeader><div className="space-y-4 px-4 pb-6">{details.map((section: { title: string; items: DetailItem[] }) => <DetailSection key={section.title} {...section} />)}</div></SheetContent></Sheet>
    <Dialog open={Boolean(editing)} onOpenChange={(open: boolean) => !open && setEditing(undefined)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{t('Koreksi & Approval Request Kendaraan')}</DialogTitle></DialogHeader>{editing && (() => {
      const persisted = requests.find((request: RequestKendaraan) => request.id === editing.id) ?? editing;
      const final = isFinalStatus(persisted);
      const adminStageOpen = !final && persisted.adminDecisionKey !== 'Available' && persisted.adminDecisionKey !== 'NotAvailable';
      const directorStageOpen = !final && persisted.adminDecisionKey === 'Available' && !persisted.plantDirectorDecisionKey;
      const stageMessage = final ? 'Request sudah final. Kedua tahap approval terkunci.' : adminStageOpen ? 'Tahap aktif: keputusan Admin Kendaraan. Keputusan Plant Director masih read-only.' : directorStageOpen ? 'Tahap Admin Kendaraan selesai dan terkunci. Tahap Plant Director sekarang aktif.' : 'Tahap approval telah selesai dan terkunci.';
      return <div className="grid gap-4 sm:grid-cols-2"><dl className="grid gap-3 rounded-lg border bg-muted p-4 text-muted-foreground sm:col-span-2 sm:grid-cols-4"><div><dt className="text-xs font-medium">Request ID</dt><dd className="mt-1 break-words text-sm font-semibold text-foreground">{getVehicleRequestNumber(editing)}</dd></div><div><dt className="text-xs font-medium">{t('Nama pemohon')}</dt><dd className="mt-1 break-words text-sm font-semibold text-foreground">{editing.namaPemohon ?? '-'}</dd></div><div><dt className="text-xs font-medium">{t('Email pemohon')}</dt><dd className="mt-1 break-words text-sm font-semibold text-foreground">{editing.emailPemohon ?? '-'}</dd></div><div><dt className="text-xs font-medium">{t('Departemen')}</dt><dd className="mt-1 break-words text-sm font-semibold text-foreground">{getVehicleDepartmentLabel(editing.departemenKey)}</dd></div></dl><div className="rounded-lg border border-l-4 border-l-primary bg-card p-3 text-sm text-card-foreground sm:col-span-2">{stageMessage}</div><TextField label="Tanggal" value={editing.tanggal} onChange={(value: string) => setEditing({ ...editing, tanggal: value })} /><TextField label="Jam" value={editing.jam} onChange={(value: string) => setEditing({ ...editing, jam: value })} /><div className="space-y-2"><Label>Tujuan</Label><Select value={editing.tujuanKey ?? 'none'} onValueChange={(value: string) => setEditing({ ...editing, tujuanKey: value === 'none' ? undefined : value as RequestKendaraanTujuanKey })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Belum dipilih</SelectItem>{Object.entries(RequestKendaraanTujuanKeyToLabel).filter(([key]: [string, string]) => Boolean(key)).map(([key,label]: [string,string]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><TextField label="Detail tujuan lainnya" value={editing.tujuanLainnyaDet} onChange={(value: string) => setEditing({ ...editing, tujuanLainnyaDet: value })} /><TextField label="Jumlah penumpang" value={editing.jumlahPenumpang} onChange={(value: string) => setEditing({ ...editing, jumlahPenumpang: value })} /><TextField label="Titik jemput" value={editing.titikJemput} onChange={(value: string) => setEditing({ ...editing, titikJemput: value })} /><TextAreaField label="Keperluan" value={editing.keperluan} onChange={(value: string) => setEditing({ ...editing, keperluan: value })} /><div className="space-y-2"><Label>Status approval</Label><Input value={RequestKendaraanCurrentStatusKeyToLabel[deriveApprovalStatus(editing) ?? 'Submitted']} readOnly aria-readonly="true" /></div><div className="space-y-2"><Label>Keputusan admin</Label><Select disabled={!adminStageOpen} value={editing.adminDecisionKey === 'Available' || editing.adminDecisionKey === 'NotAvailable' ? editing.adminDecisionKey : 'none'} onValueChange={(value: string) => { const adminDecisionKey = value === 'none' ? undefined : value as RequestKendaraanAdminDecisionKey; setEditing({ ...editing, adminDecisionKey, plantDirectorDecisionKey: undefined, plantDirectorNote: undefined }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Belum ada keputusan</SelectItem><SelectItem value="Available">Available</SelectItem><SelectItem value="NotAvailable">Not Available</SelectItem></SelectContent></Select></div><TextAreaField label="Catatan admin" value={editing.adminNote} disabled={!adminStageOpen} onChange={(value: string) => setEditing({ ...editing, adminNote: value })} /><div className="space-y-2"><Label>Keputusan Plant Director</Label><Select disabled={!directorStageOpen} value={editing.plantDirectorDecisionKey ?? 'none'} onValueChange={(value: string) => setEditing({ ...editing, plantDirectorDecisionKey: value === 'none' ? undefined : value as RequestKendaraanPlantDirectorDecisionKey })}><SelectTrigger><SelectValue placeholder="Pilih keputusan" /></SelectTrigger><SelectContent><SelectItem value="none">Belum ada keputusan</SelectItem>{Object.entries(RequestKendaraanPlantDirectorDecisionKeyToLabel).filter(([key]: [string, string]) => Boolean(key)).map(([key,label]: [string,string]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">{directorStageOpen ? 'Keputusan Admin Kendaraan Available. Tahap ini siap diproses.' : 'Aktif hanya setelah keputusan Admin Kendaraan Available tersimpan.'}</p></div><TextAreaField label="Catatan Plant Director" value={editing.plantDirectorNote} disabled={!directorStageOpen} onChange={(value: string) => setEditing({ ...editing, plantDirectorNote: value })} /></div>;
    })()}<DialogFooter><Button variant="outline" onClick={() => setEditing(undefined)}>Batal</Button><Button disabled={updateRequest.isPending} onClick={() => void saveEdit()}>{updateRequest.isPending ? 'Menyimpan...' : 'Simpan'}</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={Boolean(cancelling)} onOpenChange={(open: boolean) => !open && setCancelling(undefined)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Batalkan request kendaraan?</AlertDialogTitle><AlertDialogDescription>Request {cancelling ? getVehicleRequestNumber(cancelling) : ''} akan diubah menjadi Cancelled. Data tetap tersimpan di SharePoint.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction disabled={updateRequest.isPending} onClick={(event: MouseEvent<HTMLButtonElement>) => { event.preventDefault(); void confirmCancel(); }}>Ya, batalkan</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open: boolean) => !open && setDeleting(undefined)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus request kendaraan?</AlertDialogTitle><AlertDialogDescription>Request {deleting ? getVehicleRequestNumber(deleting) : ''} akan dihapus permanen dari SharePoint.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive" disabled={deleteRequest.isPending} onClick={(event: MouseEvent<HTMLButtonElement>) => { event.preventDefault(); void confirmDelete(); }}>Hapus permanen</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
