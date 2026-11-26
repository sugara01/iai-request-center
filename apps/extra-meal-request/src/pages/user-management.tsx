import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { KeyRound, Pencil, RefreshCw, Save, Search, Upload, UserCheck, UserPlus, UserRoundX } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/api';
import { useLanguage } from '@/lib/localization';
import { useUser } from '@/hooks/use-user';

type UserRole = 'User' | 'ITAdmin' | 'SuperAdmin';
type ManagedUser = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  department: string | null;
  jobTitle: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  role: UserRole;
  vehicleAdmin: boolean;
  mealAdmin: boolean;
  approverDoa: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
};
type UserForm = Omit<ManagedUser, 'id' | 'isActive' | 'mustChangePassword' | 'createdAt' | 'updatedAt' | 'lastLogin' | 'department' | 'jobTitle'> & {
  department: string;
  jobTitle: string;
};
type ImportResult = { created: number; updated: number };

const emptyForm: UserForm = {
  username: '',
  email: '',
  displayName: '',
  department: '',
  jobTitle: '',
  role: 'User',
  vehicleAdmin: false,
  mealAdmin: false,
  approverDoa: false,
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function UserManagementPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data: currentUser } = useUser();
  const canManageSuperAdmins = currentUser?.isSuperAdmin ?? false;
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<number>();
  const [search, setSearch] = useState('');
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => apiRequest<ManagedUser[]>('/users'),
  });
  const users = usersQuery.data ?? [];
  const visibleUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.username, user.email, user.displayName, user.department ?? '']
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [users, search]);

  const saveUser = useMutation({
    mutationFn: (payload: UserForm) => apiRequest<ManagedUser>(
      editingId ? `/users/${editingId}` : '/users',
      { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload) },
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['session'] }),
      ]);
      toast.success(t(editingId ? 'Data pengguna diperbarui' : 'Pengguna berhasil ditambahkan'));
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const setUserActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest<ManagedUser>(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: async (user) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
        queryClient.invalidateQueries({ queryKey: ['session'] }),
      ]);
      toast.success(t(user.isActive ? 'Pengguna diaktifkan' : 'Pengguna dinonaktifkan'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const resetPassword = useMutation({
    mutationFn: (id: number) => apiRequest<{ message: string }>(`/users/${id}/reset-password`, { method: 'POST' }),
    onSuccess: (_result, id) => {
      const user = users.find((item) => item.id === id);
      toast.success(t('Password untuk {{email}} direset ke password awal.', { email: user?.email ?? '' }));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const importUsers = useMutation({
    mutationFn: (csv: string) => apiRequest<ImportResult>('/users/import', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['users'] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(undefined);
  }

  function editUser(user: ManagedUser) {
    setEditingId(user.id);
    setForm({
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      department: user.department ?? '',
      jobTitle: user.jobTitle ?? '',
      role: user.role,
      vehicleAdmin: user.vehicleAdmin,
      mealAdmin: user.mealAdmin,
      approverDoa: user.approverDoa,
    });
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await saveUser.mutateAsync(form);
    } catch {
      // Mutation error is surfaced through the toast handler.
    }
  }

  async function selectCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const result = await importUsers.mutateAsync(await file.text());
      toast.success(t('Impor selesai: {{created}} ditambahkan, {{updated}} diperbarui.', result));
    } catch {
      // Mutation error is surfaced through the toast handler.
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('Administrasi sistem')}</p>
          <h1 className="mt-1 text-2xl font-bold">{t('Kelola Pengguna')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('Kelola akun, role, dan izin workflow kendaraan, extra meal, serta DoA.')}</p>
        </div>
        <Button variant="outline" onClick={() => void usersQuery.refetch()} disabled={usersQuery.isFetching}>
          <RefreshCw />{t('Refresh')}
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="size-5" />{t('Impor pengguna dari CSV Active Directory')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('Kolom yang didukung: username/sAMAccountName, email/mail/userPrincipalName, display_name, department, job_title/title, role, vehicle_admin, meal_admin, approver_doa. Password pengguna baru adalah password awal dan wajib diganti saat login tersedia.')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="file"
              accept=".csv,text/csv"
              aria-label={t('Pilih file CSV')}
              onChange={(event: ChangeEvent<HTMLInputElement>) => void selectCsv(event)}
              disabled={importUsers.isPending}
              className="max-w-xl"
            />
            {importUsers.isPending && <span className="text-sm text-muted-foreground">{t('Mengimpor pengguna...')}</span>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Pencil className="size-5" /> : <UserPlus className="size-5" />}
              {t(editingId ? 'Edit Pengguna' : 'Tambah Pengguna')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => void submitUser(event)}>
              <FormField label={t('Username')} id="user-username">
                <Input id="user-username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required maxLength={100} />
              </FormField>
              <FormField label={t('Email')} id="user-email">
                <Input id="user-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required disabled={Boolean(editingId)} maxLength={254} />
              </FormField>
              {editingId && <p className="-mt-2 text-xs text-muted-foreground">{t('Email tidak dapat diedit; impor CSV akan mencocokkan pengguna berdasarkan email.')}</p>}
              <FormField label={t('Nama tampilan')} id="user-display-name">
                <Input id="user-display-name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required maxLength={200} />
              </FormField>
              <FormField label={t('Departemen')} id="user-department">
                <Input id="user-department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} maxLength={150} />
              </FormField>
              <FormField label={t('Jabatan')} id="user-job-title">
                <Input id="user-job-title" value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} maxLength={150} />
              </FormField>
              <FormField label={t('Role sistem')} id="user-role">
                <select
                  id="user-role"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
                >
                  <option value="User">User</option>
                  <option value="ITAdmin">ITAdmin</option>
                  {canManageSuperAdmins && <option value="SuperAdmin">SuperAdmin</option>}
                </select>
              </FormField>
              <PermissionSwitch label={t('Admin Kendaraan')} checked={form.vehicleAdmin} onCheckedChange={(checked) => setForm({ ...form, vehicleAdmin: checked })} />
              <PermissionSwitch label={t('Admin Extra Meal')} checked={form.mealAdmin} onCheckedChange={(checked) => setForm({ ...form, mealAdmin: checked })} />
              <PermissionSwitch label={t('Approver DoA')} checked={form.approverDoa} onCheckedChange={(checked) => setForm({ ...form, approverDoa: checked })} />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={saveUser.isPending}>
                  <Save />{saveUser.isPending ? t('Menyimpan...') : t('Simpan Pengguna')}
                </Button>
                {editingId && <Button type="button" variant="outline" onClick={resetForm}>{t('Batal')}</Button>}
              </div>
              {!editingId && <p className="text-xs text-muted-foreground">{t('Pengguna baru dibuat dengan password awal dan wajib menggantinya saat login tersedia.')}</p>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{t('Daftar Pengguna')} ({users.length})</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 size-4" />
                <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Cari nama, username, email, departemen')} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersQuery.isPending ? (
              <div className="space-y-3" aria-hidden="true"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : usersQuery.isError ? (
              <p className="text-sm text-destructive">{getErrorMessage(usersQuery.error, t('Gagal memuat pengguna.'))}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Pengguna')}</TableHead>
                      <TableHead>{t('Role')}</TableHead>
                      <TableHead>{t('Izin workflow')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                      <TableHead className="text-right">{t('Aksi')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="min-w-52">
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-xs text-muted-foreground">{user.username} · {user.email}</div>
                          {user.department && <div className="text-xs text-muted-foreground">{user.department}</div>}
                          {user.mustChangePassword && <div className="mt-1 text-xs text-amber-700">{t('Wajib ganti password saat login')}</div>}
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="min-w-40 text-xs">
                          {[
                            user.vehicleAdmin && t('Kendaraan'),
                            user.mealAdmin && t('Extra Meal'),
                            user.approverDoa && t('Approver DoA'),
                          ].filter(Boolean).join(', ') || '—'}
                        </TableCell>
                        <TableCell><Badge variant={user.isActive ? 'default' : 'secondary'}>{t(user.isActive ? 'Aktif' : 'Nonaktif')}</Badge></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => editUser(user)} disabled={!canManageSuperAdmins && user.role === 'SuperAdmin'} aria-label={`${t('Edit Pengguna')} ${user.email}`} title={t('Edit Pengguna')}><Pencil /></Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                if (window.confirm(t('Reset password pengguna ke password awal?'))) resetPassword.mutate(user.id);
                              }}
                              disabled={resetPassword.isPending || (!canManageSuperAdmins && user.role === 'SuperAdmin')}
                              aria-label={`${t('Reset Password')} ${user.email}`}
                              title={t('Reset Password')}
                            ><KeyRound /></Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setUserActive.mutate({ id: user.id, isActive: !user.isActive })}
                              disabled={setUserActive.isPending || (!canManageSuperAdmins && user.role === 'SuperAdmin')}
                              aria-label={`${t(user.isActive ? 'Nonaktifkan' : 'Aktifkan')} ${user.email}`}
                              title={t(user.isActive ? 'Nonaktifkan' : 'Aktifkan')}
                            >{user.isActive ? <UserRoundX /> : <UserCheck />}</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {visibleUsers.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{t('Tidak ada pengguna yang cocok.')}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FormField({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>;
}

function PermissionSwitch({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-lg border p-3"><Label>{label}</Label><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}
