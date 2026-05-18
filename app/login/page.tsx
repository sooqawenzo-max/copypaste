'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { Brand } from '@/components/Shell';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password')
      })
    });

    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(body.error || 'Login failed');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <Brand />
        <h1>Login</h1>
        <form className="stack-form" onSubmit={submit}>
          <label>
            Username
            <input name="username" defaultValue="admin" autoComplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" />
          </label>
          <button className="primary-action" disabled={busy} type="submit">
            <LogIn size={16} />
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
          {error ? <p className="form-message danger-text">{error}</p> : null}
          <Link className="download-link" href="/register">
            Register by invite
          </Link>
        </form>
      </div>
    </main>
  );
}
