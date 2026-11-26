import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '@/lib/api';

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
  createdAt: string;
  lastLogin: string | null;
};

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
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile information.</p>
      </div>
      <form className="space-y-4 rounded-xl border bg-card p-6" onSubmit={save}>
        <label className="block space-y-1.5 text-sm font-medium">
          Email
          <input className="h-10 w-full rounded-md border bg-muted px-3 font-normal" value={profile.email} readOnly />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Display name
          <input className="h-10 w-full rounded-md border bg-background px-3 font-normal" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={150} required />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Department
          <input className="h-10 w-full rounded-md border bg-background px-3 font-normal" value={department} onChange={(event) => setDepartment(event.target.value)} maxLength={100} />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          Job title
          <input className="h-10 w-full rounded-md border bg-background px-3 font-normal" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} maxLength={150} />
        </label>
        <p className="text-sm text-muted-foreground">Role: {profile.role}</p>
        {message && <p className="text-sm" role="status">{message}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Save profile</button>
          <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" to="/change-password">Change password</Link>
        </div>
      </form>
    </section>
  );
}
