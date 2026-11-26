import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser, type AppUser } from '@/hooks/use-user';
import { apiRequest } from '@/lib/api';

type LoginLocationState = { from?: { pathname?: string } };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: user, isError: isSessionError } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (user && !isSessionError) return <Navigate to={user.mustChangePassword ? '/change-password' : '/'} replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const signedInUser = await apiRequest<AppUser>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      queryClient.setQueryData(['session'], signedInUser);
      const from = (location.state as LoginLocationState | null)?.from?.pathname ?? '/';
      navigate(signedInUser.mustChangePassword ? '/change-password' : from, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">IAI Request Center</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with your registered email and password.</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block space-y-1.5 text-sm font-medium">
            Email
            <input
              autoComplete="username"
              className="h-10 w-full rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            Password
            <input
              autoComplete="current-password"
              className="h-10 w-full rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <button className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
