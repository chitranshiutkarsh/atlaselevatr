'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || 'Could not sign in');
    router.refresh();
  }

  return (
    <form onSubmit={login} className="mx-auto mt-16 max-w-sm card space-y-4 p-8">
      <h1 className="font-display text-2xl font-semibold">Admin</h1>
      <input
        type="password"
        className="input"
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        required
      />
      {error && <p className="text-sm text-signal">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
    </form>
  );
}
