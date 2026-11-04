import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, CarFront, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ApprovalStatusCard } from '@/components/approval-status-card';
import { StatusBadge } from '@/components/status-badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useCreateVehicleRequest } from '@/hooks/use-vehicle-requests';

import { getVehicleDepartmentLabel, vehicleDepartmentLabels, type VehicleDepartmentKey } from '@/lib/vehicle-department';
import { vehicleDestinationLabels, type VehicleDestinationKey } from '@/lib/vehicle-destination';
import { createNewVehicleRequestNumber } from '@/lib/request-number';

export default function VehicleRequestPage() {
  const { data: user } = useUser();

  const createRequest = useCreateVehicleRequest();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState<string>();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ time: '08:00', pickup: '', destination: '' as VehicleDestinationKey | '', otherDestination: '', passengers: '1', purpose: '', notes: '', department: '' as VehicleDepartmentKey | '' });
  const setField = (field: 'time' | 'pickup' | 'otherDestination' | 'passengers' | 'purpose' | 'notes') => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current: typeof form) => ({ ...current, [field]: event.target.value }));
  const valid = Boolean(date && form.pickup && form.destination && form.purpose && form.department && Number(form.passengers) > 0 && (form.destination !== 'Lainnya' || form.otherDestination.trim()));
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!valid) { toast.error('Lengkapi seluruh kolom wajib.'); return; } setOpen(true); }
  async function confirm() {
    if (!date) return;
    try {
      const requestNumber = createNewVehicleRequestNumber();
      if (!form.destination) return;
      const submittedAt = new Date().toISOString();
      await createRequest.mutateAsync({ title: requestNumber, namaPemohon: user?.fullName ?? 'IAI User', emailPemohon: user?.userPrincipalName ?? '', departemenKey: form.department || undefined, tanggal: format(date, 'yyyy-MM-dd'), jam: form.time, tujuanKey: form.destination, tujuanLainnyaDet: form.destination === 'Lainnya' ? form.otherDestination.trim() : undefined, keperluan: form.purpose.trim(), catatan: form.notes.trim() || undefined, jumlahPenumpang: form.passengers, titikJemput: form.pickup, currentStatusKey: 'Submitted', createdDate: submittedAt, lastUpdate: submittedAt });
      toast.success(`Request ${requestNumber} tersimpan. Power Automate akan menangani approval, email, dan pembaruan status.`);
      setOpen(false);
      setSubmittedRequestNumber(requestNumber);
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : 'Kesalahan koneksi tidak diketahui.';
      toast.error(`Request belum tersimpan. Pastikan seluruh nilai sesuai dengan tipe kolom di SharePoint List RequestKendaraanApps. Detail: ${detail}`);
    }
  }

  if (submittedRequestNumber) {
    return (
      <div className="p-6 lg:p-8">
        <Button type="button" variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft />
          Dashboard
        </Button>
        <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{submittedRequestNumber}</h1>
              <StatusBadge status="Submitted" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Dibuat {format(new Date(), 'dd MMM yyyy, HH:mm')} • {user?.fullName ?? 'IAI User'}
            </p>
          </div>
        </header>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan request</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Info label="Tujuan" value={form.destination === 'Lainnya' ? form.otherDestination : form.destination ? vehicleDestinationLabels[form.destination] : '-'} />
              <Info label="Departemen" value={getVehicleDepartmentLabel(form.department || undefined)} />
              <Info label="Tanggal jemput" value={date ? format(date, 'dd MMMM yyyy') : '-'} />
              <Info label="Jam jemput" value={form.time} />
              <Info label="Titik jemput" value={form.pickup} />
              <Info label="Jumlah penumpang" value={`${form.passengers} orang`} />


              <Separator className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Info label="Keperluan" value={form.purpose} />
              </div>
              <div className="sm:col-span-2">
                <Info label="Catatan" value={form.notes || 'Tidak ada'} />
              </div>
            </CardContent>
          </Card>
          <aside className="space-y-4">
            <ApprovalStatusCard description="Request kendaraan sedang diproses melalui Power Automate." />
            <Button type="button" className="w-full" onClick={() => navigate('/')}>
              Kembali ke Dashboard Saya
            </Button>
          </aside>
        </div>
      </div>
    );
  }
  return <div className="p-6 lg:p-8"><header><Button type="button" variant="outline" size="sm" className="mb-5" onClick={() => navigate('/')} aria-label="Kembali ke dashboard"><ArrowLeft />Kembali ke dashboard</Button><p className="text-sm text-muted-foreground">IAI Request Center</p><h1 className="mt-1 text-2xl font-bold">Request kendaraan</h1><p className="mt-1 text-sm text-muted-foreground">Aplikasi menyimpan request ke SharePoint; Power Automate menangani proses setelah submit.</p></header><form onSubmit={submit} className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]"><Card><CardHeader><CardTitle>Detail perjalanan</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><DateField date={date} onSelect={setDate} /><div className="space-y-2"><Label>Jam Jemput (24 jam)</Label><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><Select value={form.time.split(':')[0]} onValueChange={(hour: string) => setForm((current: typeof form) => ({ ...current, time: `${hour}:${current.time.split(':')[1]}` }))}><SelectTrigger aria-label="Jam jemput"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 24 }, (_value: unknown, hour: number) => String(hour).padStart(2, '0')).map((hour: string) => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}</SelectContent></Select><span className="font-semibold" aria-hidden="true">:</span><Select value={form.time.split(':')[1]} onValueChange={(minute: string) => setForm((current: typeof form) => ({ ...current, time: `${current.time.split(':')[0]}:${minute}` }))}><SelectTrigger aria-label="Menit jemput"><SelectValue /></SelectTrigger><SelectContent>{['00', '15', '30', '45'].map((minute: string) => <SelectItem key={minute} value={minute}>{minute}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label htmlFor="pickup">Titik jemput</Label><Input id="pickup" value={form.pickup} onChange={setField('pickup')} /></div><div className="space-y-2"><Label>Tujuan</Label><Select value={form.destination || undefined} onValueChange={(value: VehicleDestinationKey) => setForm((current: typeof form) => ({ ...current, destination: value, otherDestination: value === 'Lainnya' ? current.otherDestination : '' }))}><SelectTrigger><SelectValue placeholder="Pilih tujuan" /></SelectTrigger><SelectContent>{Object.entries(vehicleDestinationLabels).filter(([key]: [string, string]) => Boolean(key)).map(([key, label]: [string, string]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>{form.destination === 'Lainnya' && <div className="space-y-2 md:col-span-2"><Label htmlFor="other-destination">Detail Tujuan lainnya</Label><Textarea id="other-destination" value={form.otherDestination} onChange={setField('otherDestination')} placeholder="Tuliskan detail tujuan lengkap" rows={4} required /></div>}<div className="space-y-2"><Label>Departemen</Label><Select value={form.department} onValueChange={(value: VehicleDepartmentKey) => setForm((current: typeof form) => ({ ...current, department: value }))}><SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger><SelectContent>{Object.entries(vehicleDepartmentLabels).filter(([key]: [string, string]) => Boolean(key)).map(([key, label]: [string, string]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="passengers">Jumlah penumpang</Label><Input id="passengers" type="number" min="1" value={form.passengers} onChange={setField('passengers')} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="purpose">Keperluan</Label><Input id="purpose" value={form.purpose} onChange={setField('purpose')} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="notes">Catatan</Label><Textarea id="notes" value={form.notes} onChange={setField('notes')} /></div><div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={!valid || createRequest.isPending}><Check />Tinjau & submit</Button></div></CardContent></Card><Card className="h-fit border-l-4 border-l-primary"><CardContent className="p-5"><div className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground"><CarFront className="size-5" /></div><p className="mt-4 font-medium">Batas tanggung jawab</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Proses approval terintegrasi dalam sistem ini. Power Automate hanya mengirimkan email notifikasi.</p></CardContent></Card></form><AlertDialog open={open} onOpenChange={setOpen}><AlertDialogContent className="sm:max-w-2xl"><AlertDialogHeader><AlertDialogTitle>Periksa detail request kendaraan</AlertDialogTitle><AlertDialogDescription>Pastikan seluruh informasi sudah benar sebelum request disimpan ke SharePoint.</AlertDialogDescription></AlertDialogHeader><div className="max-h-[60vh] overflow-y-auto rounded-lg border"><dl className="grid sm:grid-cols-2"><ReviewItem label="Nama requester" value={user?.fullName ?? 'IAI User'} /><ReviewItem label="Email requester" value={user?.userPrincipalName ?? '-'} /><ReviewItem label="Tanggal Jemput" value={date ? format(date, 'dd MMMM yyyy') : '-'} /><ReviewItem label="Jam Jemput" value={form.time} /><ReviewItem label="Titik jemput" value={form.pickup} /><ReviewItem label="Tujuan" value={form.destination ? vehicleDestinationLabels[form.destination] : '-'} />{form.destination === 'Lainnya' && <ReviewItem label="Detail Tujuan lainnya" value={form.otherDestination} />}<ReviewItem label="Departemen" value={getVehicleDepartmentLabel(form.department || undefined)} /><ReviewItem label="Jumlah penumpang" value={`${form.passengers} orang`} /><ReviewItem label="Keperluan" value={form.purpose} full /><ReviewItem label="Catatan" value={form.notes || 'Tidak ada'} full /></dl></div><AlertDialogFooter><AlertDialogCancel disabled={createRequest.isPending}>Periksa lagi</AlertDialogCancel><AlertDialogAction onClick={() => void confirm()} disabled={createRequest.isPending}><Check />{createRequest.isPending ? 'Menyimpan...' : 'Ya, simpan request'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium break-words">{value}</p>
    </div>
  );
}

function ReviewItem({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return <div className={`border-b p-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 ${full ? 'sm:col-span-2' : ''}`}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-semibold break-words">{value}</dd></div>;
}

function DateField({ date, onSelect }: { date?: Date; onSelect: (date: Date | undefined) => void }) { return <div className="space-y-2"><Label>Tanggal Jemput</Label><Popover><PopoverTrigger asChild><Button type="button" variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}><CalendarDays />{date ? format(date, 'dd MMMM yyyy') : 'Pilih tanggal'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={onSelect} initialFocus /></PopoverContent></Popover></div>; }
