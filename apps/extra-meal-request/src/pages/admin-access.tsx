import { useMemo, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { RefreshCw, Save, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminAccessList, useDeleteAdminAccess, useSaveAdminAccess } from '@/hooks/use-admin-access';
import type { AdminAcess } from '@/generated/models/admin-acess-model';
import { useLanguage } from '@/lib/localization';

const enabled = (value: string | undefined) => value?.toLowerCase() === 'yes' || value?.toLowerCase() === 'true';

export default function AdminAccessPage() {
  const { t } = useLanguage();
  const { data: records = [], isPending, isFetching, refetch } = useAdminAccessList();
  const saveAccess = useSaveAdminAccess();
  const deleteAccess = useDeleteAdminAccess();
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleAdmin, setVehicleAdmin] = useState(true);
  const [mealAdmin, setMealAdmin] = useState(true);
  const [recordToRevoke, setRecordToRevoke] = useState<AdminAcess>();
  const visible = useMemo(() => records.filter((record: AdminAcess) => record.title.toLowerCase().includes(query.toLowerCase())), [records, query]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) { toast.error(t('Masukkan alamat email yang valid')); return; }
    const existing = records.find((record: AdminAcess) => record.title.toLowerCase() === normalizedEmail);
    try {
      await saveAccess.mutateAsync({ existing, email: normalizedEmail, vehicleAdmin, mealAdmin });
      toast.success(t(existing ? 'Akses admin diperbarui' : 'Admin berhasil ditambahkan'));
      setEmail(''); setVehicleAdmin(true); setMealAdmin(true);
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : t('Akses admin gagal disimpan')); }
  }

  async function updateRole(record: AdminAcess, role: 'vehicle' | 'meal', checked: boolean) {
    try {
      await saveAccess.mutateAsync({ existing: record, email: record.title, vehicleAdmin: role === 'vehicle' ? checked : enabled(record.vehicleAdmin), mealAdmin: role === 'meal' ? checked : enabled(record.mealAdmin) });
      toast.success(t('Role admin diperbarui'));
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : t('Role gagal diperbarui')); }
  }

  async function revokeAccess() {
    if (!recordToRevoke) return;
    try {
      await deleteAccess.mutateAsync(recordToRevoke);
      toast.success(t('Akses admin berhasil dicabut'));
      setRecordToRevoke(undefined);
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : t('Akses admin gagal dicabut')); }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Khusus Riyan Sugara</p><h1 className="mt-1 text-2xl font-bold">Kelola akses admin</h1><p className="mt-1 text-sm text-muted-foreground">Atur akses kendaraan dan extra meal melalui data AdminAcess.</p></div><Button variant="outline" onClick={() => void refetch()} disabled={isFetching}><RefreshCw />Refresh</Button></header>
      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Assign admin</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => void save(event)}><div className="space-y-2"><Label htmlFor="admin-email">Email user</Label><Input id="admin-email" type="email" value={email} onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)} placeholder="nama@ineos.com" autoComplete="email" required /><p className="text-xs text-muted-foreground">Masukkan alamat email kantor secara manual.</p></div><RoleSwitch label="Admin Kendaraan" checked={vehicleAdmin} onCheckedChange={setVehicleAdmin} /><RoleSwitch label="Admin Extra Meal" checked={mealAdmin} onCheckedChange={setMealAdmin} /><Button type="submit" className="w-full" disabled={saveAccess.isPending || !email.trim()}><Save />{saveAccess.isPending ? 'Menyimpan...' : 'Simpan akses'}</Button></form></CardContent></Card>
        <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2"><Users className="size-5" />Daftar admin</CardTitle><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 size-4" /><Input className="pl-9" value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Cari email" /></div></div></CardHeader><CardContent>{isPending ? <div className="space-y-3" aria-hidden="true"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : <Table><TableHeader><TableRow><TableHead>Email user</TableHead><TableHead>Kendaraan</TableHead><TableHead>Extra Meal</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{visible.map((record: AdminAcess) => <TableRow key={record.id}><TableCell className="font-medium">{record.title}</TableCell><TableCell><Switch checked={enabled(record.vehicleAdmin)} onCheckedChange={(checked: boolean) => void updateRole(record, 'vehicle', checked)} aria-label={`Admin kendaraan ${record.title}`} /></TableCell><TableCell><Switch checked={enabled(record.mealAdmin)} onCheckedChange={(checked: boolean) => void updateRole(record, 'meal', checked)} aria-label={`Admin extra meal ${record.title}`} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon-sm" onClick={() => setRecordToRevoke(record)} aria-label={`${t('Cabut akses admin')} ${record.title}`}><Trash2 /></Button></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
      </div>
      <AlertDialog open={Boolean(recordToRevoke)} onOpenChange={(open: boolean) => { if (!open && !deleteAccess.isPending) setRecordToRevoke(undefined); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cabut akses admin?</AlertDialogTitle><AlertDialogDescription>{recordToRevoke ? `${recordToRevoke.title} tidak akan lagi memiliki akses Admin Kendaraan maupun Admin Extra Meal. Record pengguna akan dihapus dari SharePoint AdminAcess.` : ''}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteAccess.isPending}>Batal</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive" disabled={deleteAccess.isPending} onClick={(event: MouseEvent<HTMLButtonElement>) => { event.preventDefault(); void revokeAccess(); }}>{deleteAccess.isPending ? 'Mencabut...' : 'Ya, cabut akses'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function RoleSwitch({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-lg border p-3"><Label>{label}</Label><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}
