'use client';

import { useState } from 'react';

export default function SignInForm({ next = '/me', enabled = true }) {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next, hp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus({ state: 'done', message: `Check ${email}. Tap the link in the email to sign in.` });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  if (!enabled) {
    return <p className="rounded-lg bg-paper2/60 p-4 text-sm text-ink2">Email sign-in is not switched on yet. Please check back soon.</p>;
  }
  if (status.state === 'done') return <p className="rounded-lg bg-moss/10 p-4 font-semibold text-moss">{status.message}</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120} autoFocus />
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>
      {status.state === 'error' && <p className="text-sm text-signal">{status.message}</p>}
      <button className="btn-primary w-full" disabled={status.state === 'busy'}>
        {status.state === 'busy' ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
