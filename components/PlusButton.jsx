'use client';

import { useState } from 'react';

// Starts Atlas+ for a plan: payment link if one is set, otherwise we email it.
export default function PlusButton({ plan, signedIn, label = 'Get Atlas+', primary = true }) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  async function start() {
    if (!signedIn) {
      window.location.href = `/signin?next=${encodeURIComponent('/plans')}&why=plus`;
      return;
    }
    setState('busy');
    setError('');
    try {
      const res = await fetch('/api/plus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = `/signin?next=${encodeURIComponent('/plans')}&why=plus`;
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      if (data.pay) {
        window.location.href = data.pay;
        return;
      }
      setState('sent');
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  }

  if (state === 'sent') {
    return (
      <p className="rounded-lg bg-moss/10 px-3 py-2 text-sm font-semibold text-moss">
        You&apos;re on the list. We&apos;ll email your payment link within a day.
      </p>
    );
  }
  return (
    <div>
      <button onClick={start} disabled={state === 'busy'} className={`${primary ? 'btn-primary' : 'btn-ghost'} w-full justify-center`}>
        {state === 'busy' ? 'One moment…' : label}
      </button>
      {error && <p className="mt-2 text-xs text-signal">{error}</p>}
    </div>
  );
}
