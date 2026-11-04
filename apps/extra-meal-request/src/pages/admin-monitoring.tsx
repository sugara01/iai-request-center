import { Fragment, useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from 'react';
import { ArrowDownAZ, ArrowUpZA, ChevronDown, ChevronRight, Download, Eye, Pencil, RefreshCw, Search, Trash2, XCircle } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActionIconButton } from '@/components/action-icon-button';
import { StatusBadge } from '@/components/status-badge';
import { type MealRequest, type RequestStatus } from '@/lib/meal-store';
import { useCancelMealRequestGroup, useDeleteMealRequest, useMealRequests, useUpdateMealRequestGroup, useUpdateMealRequestQuantity } from '@/hooks/use-meal-requests';
import { AdminAnalyticsDashboard, isInAdminPeriod, type AdminPeriod, type AdminStatusFilter } from '@/components/admin-analytics-dashboard';
import { compareNewestSharePointDate } from '@/lib/sharepoint-date';
import { useLanguage } from '@/lib/localization';

type RequestGroup = { id: string; records: MealRequest[]; first: MealRequest; createdAt?: string };
type DetailItem = { label: string; value: string };
type SortField = 'requestId' | 'requester';
type SortDirection = 'asc' | 'desc';

function DetailSection({ title, items }: { title: string; items: DetailItem[] }) {
  return <section className="rounded-lg border bg-card p-4 text-card-foreground"><h3 className="mb-3 text-sm font-semibold">{title}</h3><dl className="grid gap-3 sm:grid-cols-2">{items.map((item: DetailItem) => <div key={item.label}><dt className="text-xs font-medium text-muted-foreground">{item.label}</dt><dd className="mt-1 break-words text-sm">{item.value || '-'}</dd></div>)}</dl></section>;
}

export default function AdminMonitoringPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: requests = [], isLoading, refetch, isFetching, dataUpdatedAt } = useMealRequests();
  const updateRequestGroup = useUpdateMealRequestGroup(); const updateRecordQuantity = useUpdateMealRequestQuantity(); const deleteRequest = useDeleteMealRequest(); const cancelRequestGroup = useCancelMealRequestGroup();
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField | null>(null); const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<MealRequest>(); const [selected, setSelected] = useState<MealRequest>(); const [cancelling, setCancelling] = useState<MealRequest>(); const [deleting, setDeleting] = useState<MealRequest>();
  const [period, setPeriod] = useState<AdminPeriod>('30d'); const [dashboardFilter, setDashboardFilter] = useState<AdminStatusFilter>('all');
  const periodRecords = useMemo(() => requests.filter((request: MealRequest) => isInAdminPeriod(request.createdAt, period)), [requests, period]);
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10);
  const groups = useMemo<RequestGroup[]>(() => {
    const matching = periodRecords.filter((request: MealRequest) => { const matchesDashboard = dashboardFilter === 'all' || (dashboardFilter === 'processing' && request.status === 'Submitted') || (dashboardFilter === 'approved' && request.status === 'Approved') || (dashboardFilter === 'rejected' && (request.status === 'Rejected' || request.status === 'Cancelled')); return matchesDashboard && (status === 'all' || request.status === status) && `${request.id} ${request.requester} ${request.requesterEmail} ${request.purpose} ${request.department} ${request.serviceDate}`.toLowerCase().includes(query.toLowerCase()); });
    const grouped = new Map<string, MealRequest[]>();
    matching.forEach((request: MealRequest) => grouped.set(request.id, [...(grouped.get(request.id) ?? []), request]));
    const requestGroups = Array.from(grouped.entries()).map(([id, records]: [string, MealRequest[]]) => {
      const sortedRecords = [...records].sort((a: MealRequest, b: MealRequest) => a.serviceDate.localeCompare(b.serviceDate));
      const newestCreatedAt = [...records].sort((a: MealRequest, b: MealRequest) =>
        compareNewestSharePointDate(a.createdAt, b.createdAt, a.sharePointId ?? a.recordId, b.sharePointId ?? b.recordId),
      )[0]?.createdAt;
      return { id, records: sortedRecords, first: sortedRecords[0], createdAt: newestCreatedAt };
    }).filter((group: RequestGroup) => Boolean(group.first));
    return requestGroups.sort((a: RequestGroup, b: RequestGroup) => {
      if (sortField) {
        const first = sortField === 'requestId' ? a.id : a.first.requester;
        const second = sortField === 'requestId' ? b.id : b.first.requester;
        const comparison = first.localeCompare(second, 'id', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      return compareNewestSharePointDate(a.createdAt, b.createdAt, a.id, b.id);
    });
  }, [periodRecords, query, status, dashboardFilter, sortField, sortDirection]);
  useEffect(() => {
    setPage(1);
  }, [dataUpdatedAt]);

  useEffect(() => {
    const target = searchParams.get('request');
    if (!target || isLoading) return;
    const records = requests.filter((request: MealRequest) => request.id === target);
    setSearchParams({}, { replace: true });
    if (records.length === 0 || (!records.some((record: MealRequest) => record.status === 'Submitted') && new Set(records.map((record: MealRequest) => record.status)).size === 1)) { toast.info(records.length > 0 ? `Request ${target} sudah tidak memerlukan tindakan.` : `Request ${target} tidak ditemukan.`); return; }
    setEditing({ ...records[0] });
  }, [isLoading, requests, searchParams, setSearchParams]);
  const pageCount = Math.max(1, Math.ceil(groups.length / pageSize)); const pagedGroups = groups.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  function toggle(id: string) { setExpanded((current: Set<string>) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function exportCsv() {
    const exportRecords = groups.flatMap((group: RequestGroup) => group.records);
    const rows = [
      [
        t('SharePoint ID'), t('Title'), t('Request ID'), t('Record ID'), t('Tanggal Layanan'), t('Nama Requester'),
        t('Email Requester'), t('Departemen'), t('Tujuan Acara'), t('Tanggal Mulai'), t('Tanggal Selesai'),
        t('Durasi Jam'), t('Kategori Meal'), t('Jumlah'), t('Permintaan Tambahan'), t('Status'),
        t('Pemicu Approval'), t('Waktu Request Dibuat'),
      ],
      ...exportRecords.map((request: MealRequest) => [
        String(request.sharePointId ?? ''),
        request.id,
        request.id,
        request.recordId,
        request.serviceDate,
        request.requester,
        request.requesterEmail,
        request.department,
        request.purpose,
        request.startDate,
        request.endDate,
        request.durationHours === undefined ? '' : String(request.durationHours),
        request.mealCategory,
        String(request.quantity),
        request.additional,
        request.status,
        request.approvalTrigger ? t('Ya') : t('Tidak'),
        request.createdAt,
      ]),
    ];
    const content = `\uFEFF${rows.map((row: string[]) => row.map((cell: string) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'extra-meal-sesuai-view.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('{{count}} record harian berhasil diekspor.', { count: exportRecords.length }));
  }
  function changeSort(field: SortField) { if (sortField === field) setSortDirection((current: SortDirection) => current === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } setPage(1); }
  const details = selected ? [
    {
      title: 'Identitas record',
      items: [
        { label: 'Request ID', value: selected.id },
        { label: 'Record ID', value: selected.recordId },
        { label: 'Tanggal layanan', value: selected.serviceDate },
        { label: 'Durasi', value: selected.durationHours ? `${selected.durationHours} jam` : `${requests.filter((request: MealRequest) => request.id === selected.id).length || 1} hari kalender` },
        { label: 'Pemicu approval', value: selected.approvalTrigger ? 'Ya' : 'Tidak' },
      ],
    },
    {
      title: 'Requester',
      items: [
        { label: 'Nama', value: selected.requester },
        { label: 'Email', value: selected.requesterEmail },
        { label: 'Departemen', value: selected.department },
      ],
    },
    {
      title: 'Kebutuhan meal',
      items: [
        { label: 'Tujuan acara', value: selected.purpose },
        { label: 'Kategori', value: selected.mealCategory },
        { label: 'Jumlah', value: String(selected.quantity) },
        { label: 'Catatan atau Tambahan dari requester', value: selected.additional },
        { label: 'Status harian', value: selected.status },
      ],
    },
  ] : [];
  const allPeriodGroups = useMemo<RequestGroup[]>(() => { const grouped = new Map<string, MealRequest[]>(); periodRecords.forEach((request: MealRequest) => grouped.set(request.id, [...(grouped.get(request.id) ?? []), request])); return Array.from(grouped.entries()).map(([id, records]: [string, MealRequest[]]) => { const orderedByCreation = [...records].sort((a: MealRequest, b: MealRequest) => compareNewestSharePointDate(a.createdAt, b.createdAt, a.sharePointId ?? a.recordId, b.sharePointId ?? b.recordId)); return { id, records, first: records[0], createdAt: orderedByCreation[0]?.createdAt }; }).filter((group: RequestGroup) => Boolean(group.first)); }, [periodRecords]);
  const groupStatus = (group: RequestGroup) => { const statuses = Array.from(new Set(group.records.map((record: MealRequest) => record.status))); return statuses.length === 1 ? statuses[0] : 'Status campuran'; };
  const dashboardCounts = { all: allPeriodGroups.length, processing: allPeriodGroups.filter((group: RequestGroup) => group.records.some((record: MealRequest) => record.status === 'Submitted')).length, approved: allPeriodGroups.filter((group: RequestGroup) => group.records.every((record: MealRequest) => record.status === 'Approved')).length, rejected: allPeriodGroups.filter((group: RequestGroup) => group.records.every((record: MealRequest) => record.status === 'Rejected' || record.status === 'Cancelled')).length };

  const distribution = Object.entries(allPeriodGroups.reduce<Record<string, number>>((acc: Record<string, number>, group: RequestGroup) => { const label = groupStatus(group); acc[label] = (acc[label] ?? 0) + 1; return acc; }, {})).map(([label, total]: [string, number]) => ({ label, total }));
  const attentionGroups = allPeriodGroups.filter((group: RequestGroup) => group.records.some((record: MealRequest) => record.status === 'Submitted') || groupStatus(group) === 'Status campuran').sort((a: RequestGroup, b: RequestGroup) => compareNewestSharePointDate(a.createdAt, b.createdAt, a.id, b.id));
  const nearestService = [...periodRecords].filter((record: MealRequest) => Date.parse(record.serviceDate) >= Date.now()).sort((a: MealRequest, b: MealRequest) => Date.parse(a.serviceDate) - Date.parse(b.serviceDate))[0];
  const stop = (event: MouseEvent<HTMLButtonElement>) => event.stopPropagation();
  function getRequestGroup(requestId: string) {
    return requests.filter((request: MealRequest) => request.id === requestId);
  }
  function isGroupCancellable(requestId: string) {
    const records = getRequestGroup(requestId);
    return records.length > 0 && records.every((record: MealRequest) => record.status === 'Submitted');
  }
  function confirmCancel() {
    if (!cancelling) return;
    const records = getRequestGroup(cancelling.id);
    if (!isGroupCancellable(cancelling.id)) {
      toast.error(`Request ${cancelling.id} tidak dapat dibatalkan karena statusnya sudah final.`);
      setCancelling(undefined);
      return;
    }
    void cancelRequestGroup.mutateAsync(records).then(() => {
      toast.success(`Request ${cancelling.id} dibatalkan untuk ${records.length} tanggal.`);
      setCancelling(undefined);
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : `Request ${cancelling.id} gagal dibatalkan. Data telah dimuat ulang.`);
    });
  }
  function saveGroupCorrection() {
    if (!editing) return;
    const records = getRequestGroup(editing.id);
    void updateRequestGroup.mutateAsync({ records, status: editing.status }).then(() => {
      toast.success(`Status request ${editing.id} diperbarui untuk ${records.length} tanggal.`);
      setEditing(undefined);
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : `Status request ${editing.id} gagal diperbarui. Data telah dimuat ulang.`);
    });
  }
  function saveRecordQuantity() {
    if (!editing) return;
    if (editing.quantity < 1) { toast.error('Qty meal minimal 1.'); return; }
    void updateRecordQuantity.mutateAsync({ record: editing, quantity: editing.quantity }).then(() => {
      toast.success(`Qty record tanggal ${editing.serviceDate} berhasil diperbarui.`);
      setEditing(undefined);
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : `Qty record tanggal ${editing.serviceDate} gagal diperbarui.`);
    });
  }
  const updatedAt = new Date(dataUpdatedAt || Date.now());
  return <div className="p-6 lg:p-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Admin owner extra meal</p><h1 className="mt-1 text-2xl font-bold">Monitoring extra meal</h1><p className="mt-1 text-sm text-muted-foreground">Kelola data operasional dan status approval Request Extra Meal</p><p className="mt-2 text-xs text-muted-foreground">Sinkron otomatis setiap 15 detik • terakhir diperbarui {updatedAt.toLocaleTimeString('id-ID')}</p></div><div className="flex gap-2"><Button variant="outline" disabled={isFetching} onClick={() => void refetch().then(() => toast.success('Data extra meal sudah diperbarui.'))}><RefreshCw className={isFetching ? 'animate-spin' : ''} />Refresh</Button><Button variant="outline" onClick={exportCsv}><Download />Ekspor CSV</Button></div></header><AdminAnalyticsDashboard period={period} onPeriodChange={(value: AdminPeriod) => { setPeriod(value); setPage(1); }} statusFilter={dashboardFilter} onStatusFilterChange={(value: AdminStatusFilter) => { setDashboardFilter(value); setPage(1); }} counts={dashboardCounts} indicators={[{ label: 'Record Submitted', value: periodRecords.filter((record: MealRequest) => record.status === 'Submitted').length }, { label: 'Status campuran', value: allPeriodGroups.filter((group: RequestGroup) => groupStatus(group) === 'Status campuran').length }, { label: 'Layanan terdekat', value: nearestService?.serviceDate ?? '-' }, { label: 'Total meal', value: periodRecords.reduce((total: number, record: MealRequest) => total + record.quantity, 0) }]} distribution={distribution} attention={attentionGroups.slice(0, 5).map((group: RequestGroup) => ({ id: group.id, title: `${group.id} • ${group.first.requester}`, detail: `${groupStatus(group)} • ${group.first.startDate}—${group.first.endDate}`, onOpen: () => setSelected(group.first) }))} updatedAt={updatedAt} /><Card className="mt-6"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Request extra meal</CardTitle><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 size-4" /><Input className="pl-9" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari request atau tanggal" /></div><Select value={status} onValueChange={(value: string) => { setStatus(value); setPage(1); }}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua status harian</SelectItem>{['Submitted','Approved','Rejected','Cancelled'].map((item: string) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead className="w-12" /><TableHead><Button variant="ghost" size="sm" onClick={() => changeSort('requestId')} aria-label={`Sortir Request ID ${sortField === 'requestId' && sortDirection === 'asc' ? 'Z ke A' : 'A ke Z'}`}>Request ID {sortField === 'requestId' && sortDirection === 'desc' ? <ArrowUpZA /> : <ArrowDownAZ />}</Button></TableHead><TableHead><Button variant="ghost" size="sm" onClick={() => changeSort('requester')} aria-label={`Sortir Requester ${sortField === 'requester' && sortDirection === 'asc' ? 'Z ke A' : 'A ke Z'}`}>Requester {sortField === 'requester' && sortDirection === 'desc' ? <ArrowUpZA /> : <ArrowDownAZ />}</Button></TableHead><TableHead>Acara</TableHead><TableHead>Periode</TableHead><TableHead>Record</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Memuat data ExtraMealReq...</TableCell></TableRow> : pagedGroups.map((group: RequestGroup) => { const isOpen = expanded.has(group.id); const uniqueStatuses = Array.from(new Set(group.records.map((record: MealRequest) => record.status))); return <Fragment key={group.id}><TableRow className="cursor-pointer bg-muted text-muted-foreground" onClick={() => toggle(group.id)}><TableCell><Button variant="ghost" size="icon-sm" aria-label={isOpen ? `Tutup ${group.id}` : `Buka ${group.id}`}>{isOpen ? <ChevronDown /> : <ChevronRight />}</Button></TableCell><TableCell className="font-semibold text-foreground">{group.id}</TableCell><TableCell>{group.first.requester}</TableCell><TableCell>{group.first.purpose}</TableCell><TableCell>{group.first.startDate} — {group.first.endDate}</TableCell><TableCell><Badge variant="secondary">{group.records.length} tanggal</Badge></TableCell><TableCell>{uniqueStatuses.length === 1 ? <StatusBadge status={uniqueStatuses[0]} /> : <Badge variant="outline">Status campuran</Badge>}</TableCell></TableRow>{isOpen && group.records.map((record: MealRequest) => <TableRow key={record.recordId} className="bg-card text-card-foreground"><TableCell /><TableCell><span className="text-xs text-muted-foreground">{record.recordId}</span></TableCell><TableCell colSpan={2}><span className="font-medium">{record.serviceDate}</span><span className="ml-3 text-sm text-muted-foreground">{record.mealCategory} • {record.quantity} meal</span></TableCell><TableCell>{record.approvalTrigger ? <Badge>Pemicu approval</Badge> : <Badge variant="secondary">Detail harian</Badge>}</TableCell><TableCell><StatusBadge status={record.status} /></TableCell><TableCell><div className="flex justify-end gap-1"><ActionIconButton label="Lihat detail" icon={Eye} onClick={(event: MouseEvent<HTMLButtonElement>) => { stop(event); setSelected(record); }} /><ActionIconButton label={t('Koreksi & Approval Request')} icon={Pencil} onClick={(event: MouseEvent<HTMLButtonElement>) => { stop(event); setEditing({ ...record }); }} /><ActionIconButton label="Batalkan request" icon={XCircle} disabled={!isGroupCancellable(group.id)} onClick={(event: MouseEvent<HTMLButtonElement>) => { stop(event); setCancelling(record); }} /><ActionIconButton label="Hapus record" icon={Trash2} onClick={(event: MouseEvent<HTMLButtonElement>) => { stop(event); setDeleting(record); }} /></div></TableCell></TableRow>)}</Fragment>; })}</TableBody></Table><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">{groups.length} Request ID • {periodRecords.length} record harian</p><div className="flex items-center gap-2"><Select value={String(pageSize)} onValueChange={(value: string) => { setPageSize(Number(value)); setPage(1); }}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{[10,50,100].map((size: number) => <SelectItem key={size} value={String(size)}>{size} grup</SelectItem>)}</SelectContent></Select><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current: number) => current - 1)}>Sebelumnya</Button><span className="text-sm">{page}/{pageCount}</span><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current: number) => current + 1)}>Berikutnya</Button></div></div></CardContent></Card><Sheet open={Boolean(selected)} onOpenChange={(open: boolean) => !open && setSelected(undefined)}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader className="border-b pr-12"><SheetTitle>Detail record harian</SheetTitle><SheetDescription>{selected ? `${selected.id} • ${selected.serviceDate}` : ''}</SheetDescription></SheetHeader><div className="space-y-4 px-4 pb-6">{details.map((section: { title: string; items: DetailItem[] }) => <DetailSection key={section.title} {...section} />)}</div></SheetContent></Sheet><AlertDialog open={Boolean(cancelling)} onOpenChange={(open: boolean) => !open && setCancelling(undefined)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Batalkan request Extra Meal?</AlertDialogTitle><AlertDialogDescription>{cancelling ? `${cancelling.id} dan seluruh ${getRequestGroup(cancelling.id).length} tanggal di dalamnya akan diubah menjadi Cancelled.` : ''}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction disabled={cancelRequestGroup.isPending} onClick={(event: MouseEvent<HTMLButtonElement>) => { event.preventDefault(); confirmCancel(); }}>Ya, batalkan</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><AlertDialog open={Boolean(deleting)} onOpenChange={(open: boolean) => !open && setDeleting(undefined)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus record tanggal ini?</AlertDialogTitle><AlertDialogDescription>{deleting ? `${deleting.id} untuk tanggal ${deleting.serviceDate} akan dihapus permanen. Record tanggal lain dalam Request ID yang sama tetap tersedia.` : ''}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive" onClick={() => { if (!deleting) return; if (!deleting.sharePointId) return; void deleteRequest.mutateAsync(deleting.sharePointId).then(() => toast.success(`Record ${deleting.serviceDate} dihapus.`)).catch(() => toast.error('Record gagal dihapus.')); setDeleting(undefined); }}>Hapus permanen</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><Dialog open={Boolean(editing)} onOpenChange={(open: boolean) => !open && setEditing(undefined)}><DialogContent><DialogHeader><DialogTitle>{t('Koreksi & Approval Request')}</DialogTitle></DialogHeader>{editing && <div className="grid gap-4"><div className="grid gap-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground"><span><strong>Request ID:</strong> {editing.id}</span><span><strong>Record ID:</strong> {editing.recordId}</span><span><strong>Tanggal layanan:</strong> {editing.serviceDate}</span></div><div className="space-y-2"><Label>Periode layanan</Label><Input value={`${editing.startDate} — ${editing.endDate}`} readOnly /></div><div className="space-y-2"><Label>Qty meal</Label><Input type="number" min="1" value={editing.quantity} onChange={(event: ChangeEvent<HTMLInputElement>) => setEditing({ ...editing, quantity: Number(event.target.value) })} /><p className="text-xs text-muted-foreground">Simpan Qty record ini hanya mengubah tanggal terpilih. Perubahan Qty tidak diterapkan saat menyimpan status seluruh grup.</p></div><div className="space-y-2"><Label>Status grup</Label><Select value={editing.status} onValueChange={(value: string) => setEditing({ ...editing, status: value as RequestStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Submitted','Approved','Rejected','Cancelled'].map((item: string) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Status diterapkan ke semua {getRequestGroup(editing.id).length} tanggal tanpa mengubah Qty tiap record.</p></div></div>}<DialogFooter className="flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => setEditing(undefined)}>Batal</Button><Button variant="secondary" disabled={!editing || editing.quantity < 1 || editing.sharePointId === undefined || updateRecordQuantity.isPending || updateRequestGroup.isPending} onClick={saveRecordQuantity}>Simpan Qty record ini</Button><Button disabled={!editing || updateRequestGroup.isPending || updateRecordQuantity.isPending} onClick={saveGroupCorrection}>Simpan status seluruh grup</Button></DialogFooter></DialogContent></Dialog></div>;
}
