import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, Check, ClipboardCheck, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { inclusiveDates, useMealStore, type MealRequest } from '@/lib/meal-store';
import { useCreateMealRequests } from '@/hooks/use-meal-requests';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/lib/localization';

type WeekendChoice = 'exclude' | 'include';

const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

export default function NewRequestPage() {
  const { settings } = useMealStore();
  const createRequests = useCreateMealRequests();
  const { data: user } = useUser();
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const [start, setStart] = useState<Date>();
  const [end, setEnd] = useState<Date>();
  const [open, setOpen] = useState(false);
  const [weekendChoice, setWeekendChoice] = useState<WeekendChoice>('exclude');
  const [form, setForm] = useState({ purpose: '', department: '', meal: '', otherMeal: '', quantity: '1', additional: '', hours: '1' });
  const startKey = start ? format(start, 'yyyy-MM-dd') : '';
  const endKey = end ? format(end, 'yyyy-MM-dd') : '';
  const days = useMemo(() => inclusiveDates(startKey, endKey), [startKey, endKey]);
  const weekendDays = useMemo(() => days.filter((date: Date) => isWeekend(date)), [days]);
  const selectedDays = useMemo(() => weekendChoice === 'include' ? days : days.filter((date: Date) => !isWeekend(date)), [days, weekendChoice]);
  const sameDay = Boolean(startKey && startKey === endKey);
  const valid = Boolean(start && end && end >= start && form.purpose && form.department && form.meal && Number(form.quantity) > 0 && (!sameDay || Number(form.hours) > 0) && (form.meal !== 'Other' || form.otherMeal));
  const setField = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current: typeof form) => ({ ...current, [field]: event.target.value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) { toast.error(t('Lengkapi seluruh kolom wajib.')); return; }
    setWeekendChoice('exclude');
    setOpen(true);
  }

  async function confirm() {
    if (selectedDays.length === 0) {
      toast.error(t('Tidak ada tanggal layanan yang tersisa. Sertakan weekend atau ubah rentang tanggal.'));
      return;
    }
    const now = new Date();
    const requestId = `EMR-${format(now, 'yyMMdd')}-${String(Math.floor(Math.random() * 90) + 10)}`;
    const dailyRequests: MealRequest[] = selectedDays.map((date: Date, index: number) => ({ id: requestId, recordId: `${requestId}-${format(date, 'yyyyMMdd')}`, serviceDate: format(date, 'yyyy-MM-dd'), requester: user?.fullName ?? 'IAI User', requesterEmail: user?.userPrincipalName ?? '', department: form.department, purpose: form.purpose, startDate: startKey, endDate: endKey, durationHours: sameDay ? Number(form.hours) : undefined, mealCategory: form.meal === 'Other' ? form.otherMeal : form.meal, quantity: Number(form.quantity), additional: form.additional, status: 'Submitted', createdAt: now.toISOString(), approvalTrigger: index === 0 }));
    try {
      const created = await createRequests.mutateAsync(dailyRequests);
      const savedRequestId = created[0]?.id;
      if (!savedRequestId) throw new Error(t('Request berhasil dikirim tetapi nomor tiket tidak diterima.'));
      toast.success(`${dailyRequests.length} ${t('record harian tersimpan di PostgreSQL.')}`);
      navigate(`/request/${savedRequestId}`);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : t('Kesalahan koneksi tidak diketahui.');
      toast.error(`${t('Request belum tersimpan sepenuhnya. Periksa koneksi ExtraMealReq. Detail:')} ${detail}`);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <Button type="button" variant="outline" size="sm" className="mb-5" onClick={() => navigate('/')} aria-label={t('Kembali ke dashboard')}><ArrowLeft />{t('Kembali ke dashboard')}</Button>
        <p className="text-sm text-muted-foreground">{t('Request baru')}</p>
        <h1 className="mt-1 text-2xl font-bold">{t('Form extra meal')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('Satu Request ID akan digunakan untuk semua tanggal acara.')}</p>
      </header>
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>{t('Informasi acara')}</CardTitle></CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2"><Label>{t('Tanggal mulai acara')}</Label><DateButton date={start} onSelect={setStart} /></div>
            <div className="space-y-2"><Label>{t('Tanggal selesai')}</Label><DateButton date={end} onSelect={setEnd} disabledBefore={start} /></div>
            <div className="space-y-2"><Label>{t('Durasi otomatis')}</Label><Input value={days.length ? `${days.length} ${t('hari kalender')}` : t('Pilih rentang tanggal')} readOnly /></div>
            {sameDay && <div className="space-y-2"><Label htmlFor="hours">{t('Durasi acara (jam)')}</Label><Input id="hours" type="number" min="1" value={form.hours} onChange={setField('hours')} /></div>}
            <div className="space-y-2 md:col-span-2"><Label htmlFor="purpose">{t('Tujuan acara')}</Label><Input id="purpose" value={form.purpose} onChange={setField('purpose')} placeholder={t('Contoh: Meeting dengan Customer')} /></div>
            <div className="space-y-2"><Label>{t('Nama requester')}</Label><Input value={user?.fullName ?? 'Ayu Lestari'} readOnly /></div>
            <div className="space-y-2"><Label>{t('Departemen')}</Label><Select value={form.department} onValueChange={(value: string) => setForm((current: typeof form) => ({ ...current, department: value }))}><SelectTrigger><SelectValue placeholder={t('Pilih departemen')} /></SelectTrigger><SelectContent>{settings.departments.filter((item: string) => item).map((item: string) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t('Kategori meal')}</Label><Select value={form.meal} onValueChange={(value: string) => setForm((current: typeof form) => ({ ...current, meal: value }))}><SelectTrigger><SelectValue placeholder={t('Pilih kategori')} /></SelectTrigger><SelectContent>{settings.meals.filter((item: string) => item).map((item: string) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            {form.meal === 'Other' && <div className="space-y-2"><Label htmlFor="other">{t('Kategori lainnya')}</Label><Input id="other" value={form.otherMeal} onChange={setField('otherMeal')} placeholder={t('Masukkan kategori meal')} /></div>}
            <div className="space-y-2"><Label htmlFor="quantity">{t('Qty meal per hari')}</Label><Input id="quantity" type="number" min="1" value={form.quantity} onChange={setField('quantity')} /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="additional">{t('Catatan atau Tambahan dari requester')}</Label><Textarea id="additional" value={form.additional} onChange={setField('additional')} /></div>
            <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={!valid}><ClipboardCheck />{t('Tinjau & submit')}</Button></div>
          </CardContent>
        </Card>
        <aside className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-5" />{t('Preview baris')}</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">{days.length}</p><p className="mt-1 text-sm text-muted-foreground">{t('baris harian akan dibuat')}</p><div className="mt-4 max-h-64 space-y-2 overflow-auto">{days.map((date: Date, index: number) => <div key={date.toISOString()} className="flex items-center justify-between rounded-md bg-muted p-2 text-sm text-muted-foreground"><span>{format(date, 'dd MMM yyyy')}</span><span>{index === 0 ? t('Pemicu approval') : t('Detail')}</span></div>)}</div></CardContent></Card>
          <Card className="border-l-4 border-l-primary"><CardContent className="p-5"><div className="flex gap-3"><Utensils className="mt-0.5 size-5" /><div><p className="font-medium">{t('Satu approval')}</p><p className="mt-1 text-sm text-muted-foreground">{t('Hanya baris pertama yang menandai pemicu approval. Semua baris memakai Request ID yang sama.')}</p></div></div></CardContent></Card>
        </aside>
      </form>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-2xl">
          <AlertDialogHeader><AlertDialogTitle>{t('Periksa detail request extra meal')}</AlertDialogTitle><AlertDialogDescription>{t('Pastikan seluruh informasi sudah benar.')} {selectedDays.length} {t('baris tanggal akan dibuat dengan satu proses approval.')}</AlertDialogDescription></AlertDialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {weekendDays.length > 0 && <section className="rounded-lg border-l-4 border-l-primary bg-card p-4 text-card-foreground"><h3 className="font-semibold">{t('Rentang tanggal mencakup weekend')}</h3><p className="mt-1 text-sm">{weekendDays.length} {t('tanggal Sabtu–Minggu ditemukan:')} {weekendDays.map((date: Date) => format(date, 'dd MMM yyyy')).join(', ')}</p><RadioGroup className="mt-4 grid gap-2" value={weekendChoice} onValueChange={(value: string) => setWeekendChoice(value as WeekendChoice)}><Label className="flex cursor-pointer items-start gap-3 rounded-md border p-3"><RadioGroupItem value="exclude" /><span><span className="block font-medium">{t('Keluarkan Sabtu–Minggu')}</span><span className="mt-1 block text-sm text-muted-foreground">{t('Hanya tanggal Senin–Jumat yang akan dibuat.')}</span></span></Label><Label className="flex cursor-pointer items-start gap-3 rounded-md border p-3"><RadioGroupItem value="include" /><span><span className="block font-medium">{t('Sertakan Sabtu–Minggu')}</span><span className="mt-1 block text-sm text-muted-foreground">{t('Semua tanggal dalam rentang akan dibuat.')}</span></span></Label></RadioGroup></section>}
            {selectedDays.length === 0 && <div className="rounded-lg bg-destructive p-4 text-destructive-foreground"><p className="font-semibold">{t('Tidak ada tanggal layanan yang tersisa')}</p><p className="mt-1 text-sm">{t('Sertakan weekend atau ubah rentang tanggal sebelum mengirim request.')}</p></div>}
            <section className="rounded-lg border bg-card p-4 text-card-foreground"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{t('Tanggal layanan terpilih')}</h3><BadgeCount count={selectedDays.length} label={t('tanggal')} /></div><div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto">{selectedDays.map((date: Date) => <span key={date.toISOString()} className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{format(date, 'dd MMM yyyy')}</span>)}</div></section>
            <div className="rounded-lg border"><dl className="grid sm:grid-cols-2"><ReviewItem label={t('Nama requester')} value={user?.fullName ?? 'Ayu Lestari'} /><ReviewItem label={t('Email requester')} value={user?.userPrincipalName ?? 'ayu.lestari@example.com'} /><ReviewItem label={t('Tanggal mulai')} value={start ? format(start, 'dd MMMM yyyy') : '-'} /><ReviewItem label={t('Tanggal selesai')} value={end ? format(end, 'dd MMMM yyyy') : '-'} /><ReviewItem label={t('Durasi')} value={sameDay ? `${form.hours} ${t('jam')}` : `${selectedDays.length} ${t('tanggal layanan')}`} /><ReviewItem label={t('Departemen')} value={form.department} /><ReviewItem label={t('Kategori meal')} value={form.meal === 'Other' ? form.otherMeal : form.meal} /><ReviewItem label={t('Jumlah per hari')} value={`${form.quantity} meal`} /><ReviewItem label={t('Tujuan acara')} value={form.purpose} full /><ReviewItem label={t('Catatan atau Tambahan dari requester')} value={form.additional || t('Tidak ada')} full /></dl></div>
          </div>
          <AlertDialogFooter><AlertDialogCancel>{t('Periksa lagi')}</AlertDialogCancel><AlertDialogAction onClick={() => void confirm()} disabled={createRequests.isPending || selectedDays.length === 0}><Check />{createRequests.isPending ? t('Menyimpan...') : t('Ya, submit request')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BadgeCount({ count, label }: { count: number; label: string }) {
  return <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">{count} {label}</span>;
}

function ReviewItem({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <div className={`border-b p-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 ${full ? 'sm:col-span-2' : ''}`}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-semibold break-words">{value}</dd></div>;
}

function DateButton({ date, onSelect, disabledBefore }: { date?: Date; onSelect: (date: Date | undefined) => void; disabledBefore?: Date }) { return <Popover><PopoverTrigger asChild><Button type="button" variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}><CalendarDays />{date ? format(date, 'dd MMMM yyyy') : 'Pilih tanggal'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={onSelect} disabled={disabledBefore ? { before: disabledBefore } : undefined} initialFocus /></PopoverContent></Popover>; }
