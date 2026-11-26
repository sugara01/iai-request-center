import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { apiRequest } from '@/lib/api';
import { toast } from 'sonner';

const passwordRules = [
  { label: 'At least 8 characters', test: (password: string) => password.length >= 8 },
  { label: 'No more than 128 characters', test: (password: string) => password.length <= 128 },
  { label: 'At least one uppercase letter', test: (password: string) => /[A-Z]/.test(password) },
  { label: 'At least one lowercase letter', test: (password: string) => /[a-z]/.test(password) },
  { label: 'At least one number', test: (password: string) => /\d/.test(password) },
];

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (passwordRules.some((rule) => !rule.test(newPassword))) {
      setError('New password must meet all the requirements below.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (user) queryClient.setQueryData(['session'], { ...user, mustChangePassword: false });
      toast.success('Password changed successfully.');
      navigate('/', { replace: true });
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Password change failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Change password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user?.mustChangePassword ? 'Change your temporary password to continue.' : 'Update your account password.'}
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block space-y-1.5 text-sm font-medium">
            Current password
            <input autoComplete="current-password" className="h-10 w-full rounded-md border bg-background px-3 font-normal" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            New password
            <input autoComplete="new-password" className="h-10 w-full rounded-md border bg-background px-3 font-normal" type="password" minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Confirm new password
            <input autoComplete="new-password" className="h-10 w-full rounded-md border bg-background px-3 font-normal" type="password" minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </label>
          <ul className="space-y-1 text-xs text-muted-foreground" aria-label="Password requirements">
            {passwordRules.map((rule) => (
              <li key={rule.label} className={rule.test(newPassword) ? 'text-emerald-700 dark:text-emerald-400' : undefined}>
                {rule.test(newPassword) ? '✓' : '•'} {rule.label}
              </li>
            ))}
          </ul>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <button className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </section>
    </main>
  );
}
