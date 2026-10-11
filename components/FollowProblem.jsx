'use client';

import { useState } from 'react';

// "Email me when someone builds this": follow one problem by email.
export default function FollowProblem({ problemId, email: knownEmail = '', following = false }) {
  const [email, setEmail] = useState(knownEmail);
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState({ state: following ? 'done' : 'idle', message: '' });

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch(`/api/problems/${problemId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, hp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus({ state: 'done', message: '' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  if (status.state === 'done') {
    return <p className="text-sm font-semibold text-moss">✓ We&apos;ll email you when someone claims this or suggests a fix.</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-sm font-semibold sm:mr-1">🔔 Email me when someone builds this</span>
      <input
        className="input sm:max-w-[220px]"
        type="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        maxLength={120}
      />
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>
      <button className="btn-ghost px-4 py-2 text-xs" disabled={status.state === 'busy'}>
        {status.state === 'busy' ? 'Saving…' : 'Follow'}
      </button>
      {status.state === 'error' && <span className="text-xs text-signal">{status.message}</span>}
    </form>
  );
}
