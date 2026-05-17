'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Brand } from '@/components/Shell';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite: form.get('invite'),
        username: form.get('username'),
        forumNick: form.get('forumNick'),
        password: form.get('password')
      })
    });

    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(body.error || 'Registration failed');
      return;
    }

    router.push(`/u/${body.user.uid}`);
    router.refresh();
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <Brand />
        <h1>Invite register</h1>
        <form className="stack-form" onSubmit={submit}>
          <input name="invite" placeholder="invite key" required />
          <input name="username" placeholder="username" required />
          <input name="forumNick" placeholder="forum nick" />
          <input name="password" placeholder="password" type="password" required />
          <button className="primary-action" disabled={busy} type="submit">
            <KeyRound size={16} />
            {busy ? 'Creating...' : 'Create profile'}
          </button>
          {error ? <p className="form-message danger-text">{error}</p> : null}
          <Link className="download-link" href="/login">
            Login instead
          </Link>
        </form>
      </div>
    </main>
  );
}
