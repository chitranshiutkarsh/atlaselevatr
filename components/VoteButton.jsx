'use client';

import { useEffect, useState } from 'react';

const KEY = 'atlas_voted';

export function readVoted() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function rememberVote(id) {
  try {
    const set = readVoted();
    set.add(id);
    localStorage.setItem(KEY, JSON.stringify(Array.from(set).slice(-500)));
  } catch {}
}

// "I face this": the one way to back a problem. It counts the person once;
// on the problem page they can add a story to make it evidence.
export default function VoteButton({ id, votes: initial, compact = false, onVoted }) {
  const [votes, setVotes] = useState(initial);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVoted(readVoted().has(id));
  }, [id]);

  // Follow vote counts pushed in from live updates.
  useEffect(() => {
    if (!busy) setVotes(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function vote() {
    if (voted || busy) return;
    setBusy(true);
    setVoted(true);
    setVotes((v) => v + 1);
    onVoted?.(id, votes + 1);
    try {
      const res = await fetch(`/api/problems/${id}/vote`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVotes(data.votes);
      onVoted?.(id, data.votes);
      rememberVote(id);
    } catch {
      setVoted(false);
      setVotes((v) => v - 1);
      onVoted?.(id, votes);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={vote}
      disabled={busy}
      aria-pressed={voted}
      aria-label={voted ? 'You face this problem' : 'I face this problem'}
      title={voted ? 'You face this' : 'I face this'}
      className={`flex shrink-0 flex-col items-center justify-center rounded-lg border font-mono transition ${
        compact ? 'h-12 w-11 text-xs' : 'h-16 w-14 gap-0.5 text-sm'
      } ${voted ? 'border-signal bg-signal text-white' : 'border-ink/15 bg-paper text-ink hover:border-signal hover:text-signal'}`}
    >
      <span aria-hidden="true">▲</span>
      <span className="font-semibold">{votes}</span>
      {!compact && <span className="text-[8px] uppercase leading-none tracking-wide opacity-80">{voted ? 'You too' : 'Face it'}</span>}
    </button>
  );
}
