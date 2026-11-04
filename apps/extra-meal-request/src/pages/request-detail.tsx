import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ApprovalStatusCard } from '@/components/approval-status-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/status-badge';
import { inclusiveDates } from '@/lib/meal-store';
import { useMealRequests } from '@/hooks/use-meal-requests';

export default function RequestDetailPage() {
  const { id } = useParams(); const { data: requests = [], isLoading, isFetching, refetch } = useMealRequests(); const records = requests.filter((item: import('@/lib/meal-store').MealRequest) => item.id === id); const request = records[0];
  const [hasRetried, setHasRetried] = useState(false);
  useEffect(() => {
    if (!isLoading && !isFetching && !request && !hasRetried) {
      setHasRetried(true);
      void refetch();
    }
  }, [hasRetried, isFetching, isLoading, refetch, request]);
  if (isLoading || isFetching || (!request && !hasRetried)) return <div className="p-8"><p className="text-muted-foreground">Memuat request...</p></div>;
  if (!request) return <div className="p-8"><h1 className="text-2xl font-bold">Request berhasil disimpan</h1><p className="mt-2 text-muted-foreground">Detail sedang disinkronkan dari SharePoint. Request dapat dilihat di Dashboard Saya.</p><Button className="mt-4" asChild><Link to="/">Lihat Dashboard Saya</Link></Button></div>;
  const dates = inclusiveDates(request.startDate, request.endDate);
  return <div className="p-6 lg:p-8"><Button variant="ghost" asChild><Link to="/"><ArrowLeft />Dashboard</Link></Button><header className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{request.id}</h1><StatusBadge status={request.status} /></div><p className="mt-2 text-sm text-muted-foreground">Dibuat {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm')} • {request.requester}</p></div></header><div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]"><Card><CardHeader><CardTitle>Ringkasan request</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><Info label="Tujuan acara" value={request.purpose} /><Info label="Departemen" value={request.department} /><Info label="Periode" value={`${request.startDate} — ${request.endDate}`} /><Info label="Durasi" value={request.durationHours ? `${request.durationHours} jam` : `${dates.length} hari`} /><Info label="Kategori meal" value={request.mealCategory} /><Info label="Qty per hari" value={`${request.quantity} meal`} /><div className="sm:col-span-2"><Info label="Tambahan meal/minuman" value={request.additional || 'Tidak ada'} /></div><Separator className="sm:col-span-2" /><div className="sm:col-span-2"><p className="mb-3 text-sm font-medium">Rincian record harian</p><div className="space-y-2">{records.map((record: import('@/lib/meal-store').MealRequest, index: number) => <div key={record.recordId} className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm text-muted-foreground"><span className="flex items-center gap-2"><CalendarDays className="size-4" />{format(new Date(`${record.serviceDate}T00:00:00`), 'dd MMMM yyyy')}</span><span>{index === 0 ? 'Pemicu approval' : record.status}</span></div>)}</div></div></CardContent></Card><aside><ApprovalStatusCard description="Menunggu keputusan Plant Manager melalui Power Automate." /></aside></div></div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>; }
