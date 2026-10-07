'use client';

import { useEffect, useState } from 'react';

const KEY = 'atlas_voted';

function readVoted() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function remember(id) {
  try {
    const set = readVoted();
    set.add(id);
    localStorage.setItem(KEY, JSON.stringify(Array.from(set).slice(-500)));
  } catch {}
}

export default function VoteButton({ id, votes: initial, compact = false }) {
  const [votes, setVotes] = useState(initial);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVoted(readVoted().has(id));
  }, [id]);

  async function vote() {
    if (voted || busy) return;
    setBusy(true);
    setVoted(true);
    setVotes((v) => v + 1);
    try {
      const res = await fetch(`/api/problems/${id}/vote`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVotes(data.votes);
      remember(id);
    } catch {
      setVoted(false);
      setVotes((v) => v - 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={vote}
      disabled={busy}
      aria-pressed={voted}
      aria-label={voted ? 'You voted for this' : 'Vote for this problem'}
      className={`flex shrink-0 flex-col items-center justify-center rounded-lg border font-mono transition ${
        compact ? 'h-12 w-11 text-xs' : 'h-16 w-14 text-sm'
      } ${voted ? 'border-signal bg-signal text-white' : 'border-ink/15 bg-paper text-ink hover:border-signal hover:text-signal'}`}
    >
      <span aria-hidden="true">▲</span>
      <span className="font-semibold">{votes}</span>
    </button>
  );
}
