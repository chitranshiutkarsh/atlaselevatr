'use client';

import { useEffect, useRef, useState } from 'react';
import { PROOF_FREQUENCY, PROOF_PAY, PROOF_WHO, VALIDATION } from '@/lib/constants';
import { readVoted, rememberVote } from './VoteButton';
import ShareBar from './ShareBar';

const KEY = 'atlas_proofs';

function remembered(id) {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]').includes(id);
  } catch {
    return false;
  }
}
function remember(id) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!list.includes(id)) list.push(id);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-500)));
    // Saying it happens to you is also a vote; keep the vote button in sync.
    const voted = new Set(JSON.parse(localStorage.getItem('atlas_voted') || '[]'));
    voted.add(id);
    localStorage.setItem('atlas_voted', JSON.stringify(Array.from(voted).slice(-500)));
  } catch {}
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const label = (list, key) => list.find(([k]) => k === key)?.[1] || key;

function Bars({ title, options, counts, total, accent }) {
  return (
    <div>
      <p className="label">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {options.map(([k, l]) => {
          const n = counts[k] || 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <li key={k} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="truncate">{l}</span>
                <span className="font-mono text-xs text-ink2">{pct}%</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-paper2">
                <div className={`h-1.5 rounded-full ${accent}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const EMPTY = { story: '', frequency: '', pay: '', who: '', city: '', author: '', hp: '' };

// The one action on a problem: "I face this". It counts you straight away
// (a vote), then invites an optional one-line story that turns the vote into
// evidence a founder can use. Ten stories validate the problem.
export default function FacePanel({ problemId, votes: initialVotes, initial, share }) {
  const [summary, setSummary] = useState(initial);
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);
  const [storied, setStoried] = useState(false);
  const [open, setOpen] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const started = useRef(0);

  useEffect(() => {
    setStoried(remembered(problemId));
    setVoted(readVoted().has(problemId) || remembered(problemId));
  }, [problemId]);
  useEffect(() => {
    if (open) started.current = Date.now();
  }, [open]);
  useEffect(() => {
    if (window.location.hash === '#proof' && !remembered(problemId)) setOpen(true);
  }, [problemId]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function face() {
    if (voted) return setOpen(true);
    setVoted(true);
    setVotes((v) => v + 1);
    setJustVoted(true);
    setOpen(true);
    try {
      const res = await fetch(`/api/problems/${problemId}/vote`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVotes(data.votes);
      rememberVote(problemId);
    } catch {
      setVoted(false);
      setVotes((v) => v - 1);
      setJustVoted(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch(`/api/problems/${problemId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, t: started.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      if (data.summary) setSummary(data.summary);
      if (data.votes) setVotes(data.votes);
      remember(problemId);
      setStoried(true);
      setVoted(true);
      setOpen(false);
      setStatus({ state: 'done', message: 'Thanks. Your story is now part of the evidence for this problem.' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  const total = summary.total;
  const toGo = Math.max(0, VALIDATION.proofs - total);
  const payers = (summary.pay.small || 0) + (summary.pay.medium || 0) + (summary.pay.high || 0);
  const often = (summary.frequency.daily || 0) + (summary.frequency.weekly || 0);

  return (
    <section id="proof" className="mt-8 scroll-mt-24">
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Do you face this?</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {votes === 0 ? 'Be the first to say you face this' : `${votes.toLocaleString('en-IN')} ${votes === 1 ? 'person faces' : 'people face'} this`}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-ink2">
              {total} first-hand {total === 1 ? 'story' : 'stories'}.{' '}
              {toGo > 0
                ? `${toGo} more and this problem is validated for founders.`
                : '✓ Validated: enough people have shared what it costs them.'}
            </p>
            {total > 0 && (
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink2">
                {Math.round((payers / total) * 100)}% would pay · {Math.round((often / total) * 100)}% weekly or more
              </p>
            )}
          </div>
          {!voted ? (
            <button onClick={face} className="btn-primary shrink-0">▲ I face this</button>
          ) : storied ? (
            <span className="inline-flex shrink-0 items-center rounded-full border border-moss bg-moss/10 px-4 py-2 text-sm font-semibold text-moss">
              ✓ You face this · story added
            </span>
          ) : (
            !open && (
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <span className="text-sm font-semibold text-moss">✓ You face this</span>
                <button onClick={() => setOpen(true)} className="btn-ghost">Add your story</button>
              </div>
            )
          )}
        </div>

        {/* Progress to validation */}
        <div className="h-1.5 bg-paper2">
          <div className="h-1.5 bg-moss transition-all" style={{ width: `${Math.min(100, (total / VALIDATION.proofs) * 100)}%` }} />
        </div>

        {open && (
          <form onSubmit={submit} className="space-y-4 border-t border-ink/10 bg-paper/60 p-6">
            {justVoted && (
              <p className="text-sm font-semibold text-moss">
                ✓ Counted. Make it count more: add one line about the last time it happened. (Optional)
              </p>
            )}
            <div>
              <label className="label" htmlFor="pr-story">What happened to you? *</label>
              <textarea
                id="pr-story"
                rows={3}
                className="input mt-1.5"
                value={f.story}
                onChange={set('story')}
                minLength={15}
                maxLength={500}
                required
                placeholder="One or two lines: the last time it happened and what it cost you (time, money, stress)"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="pr-freq">How often? *</label>
                <select id="pr-freq" className="input mt-1.5" value={f.frequency} onChange={set('frequency')} required>
                  <option value="" disabled>Choose one</option>
                  {PROOF_FREQUENCY.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pr-pay">Would you pay for a fix? *</label>
                <select id="pr-pay" className="input mt-1.5" value={f.pay} onChange={set('pay')} required>
                  <option value="" disabled>Choose one</option>
                  {PROOF_PAY.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pr-who">Who does it hit? *</label>
                <select id="pr-who" className="input mt-1.5" value={f.who} onChange={set('who')} required>
                  <option value="" disabled>Choose one</option>
                  {PROOF_WHO.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="input" placeholder="City (optional)" value={f.city} onChange={set('city')} maxLength={60} />
              <input className="input" placeholder="Your first name (optional)" value={f.author} onChange={set('author')} maxLength={60} />
            </div>
            <div className="hidden" aria-hidden="true">
              <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
            </div>
            {status.state === 'error' && <p className="text-sm text-signal">{status.message}</p>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink2">No sign-up needed. You&apos;re only counted once.</p>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{justVoted ? 'Skip' : 'Cancel'}</button>
                <button className="btn-primary" disabled={status.state === 'busy'}>
                  {status.state === 'busy' ? 'Saving…' : 'Add my story'}
                </button>
              </div>
            </div>
          </form>
        )}

        {status.state === 'done' && <p className="border-t border-ink/10 px-6 py-3 text-sm text-moss">{status.message}</p>}

        {share && (
          <div className={`border-t border-ink/10 px-6 py-4 ${voted ? 'bg-signal/5' : ''}`}>
            {voted && (
              <p className="mb-1 text-sm font-semibold">Bring 3 people who face this too. Every one moves it closer to being built.</p>
            )}
            <ShareBar {...share} faced={Math.max(total, votes)} />
          </div>
        )}

        {total > 0 && (
          <div className="grid gap-6 border-t border-ink/10 p-6 sm:grid-cols-3">
            <Bars title="How often" options={PROOF_FREQUENCY} counts={summary.frequency} total={total} accent="bg-ink" />
            <Bars title="Would pay" options={PROOF_PAY.map(([k, l]) => [k, l.split(' (')[0]])} counts={summary.pay} total={total} accent="bg-signal" />
            <Bars title="Who it hits" options={PROOF_WHO} counts={summary.who} total={total} accent="bg-moss" />
          </div>
        )}

        {summary.stories.length > 0 && (
          <ul className="divide-y divide-ink/10 border-t border-ink/10">
            {summary.stories.slice(0, 8).map((s) => (
              <li key={s.id} className="px-6 py-4">
                <p>“{s.story}”</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink2">
                  {s.author || 'Anonymous'}
                  {s.city ? ` · ${s.city}` : ''} · {label(PROOF_FREQUENCY, s.frequency)} · {label(PROOF_PAY, s.pay).split(' (')[0]} · {timeAgo(s.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
