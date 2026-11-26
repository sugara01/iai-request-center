import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

type UserProfile = {
  username: string;
  email: string;
  displayName: string;
  department: string | null;
  jobTitle: string | null;
  role: string;
  isVehicleAdmin: boolean;
  isMealAdmin: boolean;
  isApproverDoa: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLogin: string | null;
  passwordChangedAt: string | null;
  loginCount: number;
};

function formatDate(value: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not recorded'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function PermissionValue({ enabled }: { enabled: boolean }) {
  return (
    <Badge className={enabled
      ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
      : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}>
      {enabled ? 'Yes' : 'No'}
    </Badge>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isPending, error } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiRequest<UserProfile>('/profile'),
  });
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setDepartment(profile.department ?? '');
    setJobTitle(profile.jobTitle ?? '');
  }, [profile]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    try {
      await apiRequest<UserProfile>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, department, jobTitle }),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['session'] }),
      ]);
      setMessage('Profile updated.');
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : 'Profile update failed.');
    }
  };

  if (isPending) return <div className="p-8 text-sm text-muted-foreground">Loading profile…</div>;
  if (error || !profile) return <div className="p-8 text-sm text-destructive">{error instanceof Error ? error.message : 'Profile could not be loaded.'}</div>;

  return (
    <section className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">User profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your profile, permissions, and account security information.</p>
      </div>
      <form className="space-y-5" onSubmit={save}>
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div>
            <h2 className="font-semibold">Basic Information</h2>
            <p className="text-sm text-muted-foreground">Your work profile and assigned system role.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              Full Name
              <input className="h-10 w-full rounded-md border bg-background px-3 font-normal" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={150} required />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Email Address
              <input className="h-10 w-full rounded-md border bg-muted px-3 font-normal" value={profile.email} readOnly />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Department
              <input className="h-10 w-full rounded-md border bg-background px-3 font-normal" value={department} onChange={(event) => setDepartment(event.target.value)} maxLength={100} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Job Title
              <input className="h-10 w-full rounded-md border bg-background px-3 font-normal" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} maxLength={150} />
            </label>
          </div>
          <div className="space-y-1.5 text-sm font-medium">
            System Role
            <div>
              <Badge className={profile.role === 'SuperAdmin'
                ? 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200'
                : profile.role === 'ITAdmin'
                  ? 'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200'
                  : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}>
                {profile.role === 'SuperAdmin' ? 'SUPER ADMIN' : profile.role === 'ITAdmin' ? 'IT ADMIN' : 'USER'}
              </Badge>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Permissions</h2>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-3"><dt className="text-sm">Vehicle Admin</dt><dd><PermissionValue enabled={profile.isVehicleAdmin} /></dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-sm">Meal Admin</dt><dd><PermissionValue enabled={profile.isMealAdmin} /></dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-sm">Approver DOA</dt><dd><PermissionValue enabled={profile.isApproverDoa} /></dd></div>
          </dl>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Account Information</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Account Status</dt><dd className="mt-1"><Badge className={profile.isActive ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-red-200 bg-red-100 text-red-800'}>{profile.isActive ? 'Active' : 'Disabled'}</Badge></dd></div>
            <div><dt className="text-sm text-muted-foreground">Created Date</dt><dd className="mt-1 text-sm">{formatDate(profile.createdAt)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Last Login</dt><dd className="mt-1 text-sm">{formatDate(profile.lastLogin)}</dd></div>
          </dl>
        </section>

        <section className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-semibold">Security Information</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Password Last Changed</dt><dd className="mt-1 text-sm">{formatDate(profile.passwordChangedAt)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Must Change Password</dt><dd className="mt-1"><PermissionValue enabled={profile.mustChangePassword} /></dd></div>
            <div><dt className="text-sm text-muted-foreground">Successful Logins</dt><dd className="mt-1 text-sm">{profile.loginCount}</dd></div>
          </dl>
        </section>

        {message && <p className="text-sm" role="status">{message}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Save profile</button>
          <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" to="/change-password">Change password</Link>
        </div>
      </form>
    </section>
  );
}
