'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// "I care about this": adds a problem to someone's list. Their jobs feed then
// shows roles at the startups working on it. No sign-in needed.
export default function CareButton({ problemId, initialCared = false, initialCount = 0, refresh = false, compact = false }) {
  const router = useRouter();
  const [cared, setCared] = useState(initialCared);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    const next = !cared;
    setBusy(true);
    setError('');
    setCared(next);
    setCount((n) => Math.max(0, n + (next ? 1 : -1)));
    try {
      const res = await fetch(`/api/problems/${problemId}/care`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save that');
      setCount(data.cares);
      if (refresh) router.refresh();
    } catch (err) {
      setCared(!next);
      setCount((n) => Math.max(0, n + (next ? -1 : 1)));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={cared}
        className={`btn ${compact ? 'px-3 py-1.5 text-xs' : ''} ${
          cared ? 'bg-signal text-white hover:bg-ink' : 'border border-ink/20 text-ink hover:border-signal hover:text-signal'
        }`}
      >
        <span aria-hidden="true">{cared ? '♥' : '♡'}</span> I care about this
        {compact && count > 0 ? <span className="font-mono text-[11px] opacity-80">{count}</span> : null}
      </button>
      {!compact && (
        <span className="text-sm text-ink2">
          {count > 0 ? `${count.toLocaleString('en-IN')} ${count === 1 ? 'person cares' : 'people care'}. ` : ''}
          {cared ? (
            <a href="/jobs" className="font-semibold text-signal hover:underline">See roles for you →</a>
          ) : (
            'Get roles at the startups working on it.'
          )}
        </span>
      )}
      {error && <span className="text-xs text-signal">{error}</span>}
    </span>
  );
}
