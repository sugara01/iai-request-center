import { AlertTriangle, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/lib/localization';

export type AdminPeriod = '7d' | '30d' | 'month' | 'all';
export type AdminStatusFilter = 'all' | 'processing' | 'approved' | 'rejected';

export type StatusPoint = { label: string; total: number };
export type AttentionItem = { id: string; title: string; detail: string; onOpen: () => void };

type Props = {
  period: AdminPeriod;
  onPeriodChange: (period: AdminPeriod) => void;
  statusFilter: AdminStatusFilter;
  onStatusFilterChange: (filter: AdminStatusFilter) => void;
  counts: Record<AdminStatusFilter, number>;
  indicators: { label: string; value: string | number }[];

  distribution: StatusPoint[];
  attention: AttentionItem[];
  updatedAt: Date;
};

const chartConfig = { total: { label: 'Request', color: 'var(--chart-1)' } } satisfies ChartConfig;
const cards = [
  { key: 'all', label: 'Total request', icon: Clock3 },
  { key: 'processing', label: 'Sedang diproses', icon: Clock3 },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected / Cancelled', icon: XCircle },
] as const;

export function isInAdminPeriod(value: string | undefined, period: AdminPeriod, now = new Date()) {
  if (period === 'all') return true;
  const date = value ? new Date(value) : new Date(Number.NaN);
  if (Number.isNaN(date.getTime())) return false;
  if (period === 'month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  const days = period === '7d' ? 7 : 30;
  return date.getTime() >= now.getTime() - days * 86_400_000;
}

export function AdminAnalyticsDashboard({ period, onPeriodChange, statusFilter, onStatusFilterChange, counts, indicators, distribution, attention, updatedAt }: Props) {
  const { locale, t } = useLanguage();

  return <section className="mt-6 space-y-4" aria-label={t('Dashboard analitik operasional')}>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 text-card-foreground"><div><h2 className="font-semibold">{t('Ringkasan operasional')}</h2><p className="text-sm text-muted-foreground">{t('Diperbarui')} {updatedAt.toLocaleString(locale)}</p></div><Select value={period} onValueChange={(value: string) => onPeriodChange(value as AdminPeriod)}><SelectTrigger className="w-44" aria-label={t('Periode analitik')}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7d">{t('7 hari terakhir')}</SelectItem><SelectItem value="30d">{t('30 hari terakhir')}</SelectItem><SelectItem value="month">{t('Bulan berjalan')}</SelectItem><SelectItem value="all">{t('Semua data')}</SelectItem></SelectContent></Select></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ key, label, icon: Icon }) => <button key={key} type="button" className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onStatusFilterChange(key)} aria-pressed={statusFilter === key}><Card className={statusFilter === key ? 'border-primary' : 'hover:border-primary'}><CardContent className="flex items-center justify-between p-4"><div><p className="text-sm text-muted-foreground">{t(label)}</p><p className="mt-1 text-2xl font-bold">{counts[key]}</p></div><span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Icon className="size-4" /></span></CardContent></Card></button>)}</div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{indicators.map((item: { label: string; value: string | number }) => <Card key={item.label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t(item.label)}</p><p className="mt-1 text-xl font-semibold">{item.value}</p></CardContent></Card>)}</div>
    <div className="grid gap-4 xl:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">{t('Distribusi status')}</CardTitle></CardHeader><CardContent><ChartContainer config={chartConfig} className="h-52 w-full"><BarChart accessibilityLayer data={distribution} layout="vertical"><CartesianGrid horizontal={false} /><XAxis type="number" hide /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="total" fill="var(--chart-2)" radius={4} /></BarChart></ChartContainer><div className="mt-2 grid grid-cols-2 gap-2 text-sm">{distribution.map((item: StatusPoint) => <div key={item.label} className="flex justify-between"><span className="text-muted-foreground">{t(item.label)}</span><strong>{item.total}</strong></div>)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4" />{t('Perlu perhatian')}</CardTitle></CardHeader><CardContent className="space-y-2">{attention.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t('Tidak ada request aktif yang perlu perhatian.')}</p> : attention.slice(0, 5).map((item: AttentionItem) => <Button key={item.id} variant="outline" className="h-auto w-full justify-start p-3 text-left" onClick={item.onOpen}><span className="min-w-0"><span className="block truncate font-medium">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.detail}</span></span></Button>)}</CardContent></Card>
    </div>
  </section>;
}
