const DEMO_USER_KEY = 'iai-demo-user';

export function getDemoUserEmail() {
  return localStorage.getItem(DEMO_USER_KEY) ?? 'ayu.lestari@example.com';
}

export function setDemoUserEmail(email: string) {
  localStorage.setItem(DEMO_USER_KEY, email);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-User': getDemoUserEmail(),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.json() as { error?: string };
      message = body.error || message;
    } catch (error: unknown) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}
