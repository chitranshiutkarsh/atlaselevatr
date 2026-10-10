'use client';

import { useEffect, useRef, useState } from 'react';
import { PROOF_FREQUENCY, PROOF_PAY, PROOF_WHO, VALIDATION } from '@/lib/constants';

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

// "This happens to me": turns a vote into evidence a founder can use.
export default function ProofPanel({ problemId, initial, builders = 0 }) {
  const [summary, setSummary] = useState(initial);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const started = useRef(0);

  useEffect(() => setDone(remembered(problemId)), [problemId]);
  useEffect(() => {
    if (open) started.current = Date.now();
  }, [open]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

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
      remember(problemId);
      setDone(true);
      setOpen(false);
      setStatus({ state: 'done', message: 'Thanks. Your story is now part of the evidence for this problem.' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  const total = summary.total;
  const toGo = Math.max(0, VALIDATION.proofs - total);
  const validated = total >= VALIDATION.proofs && builders >= VALIDATION.builders;
  const payers = (summary.pay.small || 0) + (summary.pay.medium || 0) + (summary.pay.high || 0);
  const often = (summary.frequency.daily || 0) + (summary.frequency.weekly || 0);

  return (
    <section id="proof" className="mt-10 scroll-mt-24">
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label">Proof it&apos;s real</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {total === 0 ? 'Does this happen to you?' : `${total} ${total === 1 ? 'person faces' : 'people face'} this`}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-ink2">
              {validated
                ? '✓ Validated: real people face it and someone is building it.'
                : toGo > 0
                  ? `${toGo} more first-hand ${toGo === 1 ? 'story' : 'stories'} and this problem counts as validated for founders.`
                  : 'Enough first-hand stories. It is validated once a builder claims it.'}
            </p>
            {total > 0 && (
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink2">
                {Math.round((payers / total) * 100)}% would pay · {Math.round((often / total) * 100)}% weekly or more
              </p>
            )}
          </div>
          {done ? (
            <span className="inline-flex shrink-0 items-center rounded-full border border-moss bg-moss/10 px-4 py-2 text-sm font-semibold text-moss">
              🙋 You face this too
            </span>
          ) : (
            !open && (
              <button onClick={() => setOpen(true)} className="btn-primary shrink-0">
                🙋 This happens to me
              </button>
            )
          )}
        </div>

        {/* Progress to validation */}
        <div className="h-1.5 bg-paper2">
          <div className="h-1.5 bg-moss transition-all" style={{ width: `${Math.min(100, (total / VALIDATION.proofs) * 100)}%` }} />
        </div>

        {open && (
          <form onSubmit={submit} className="space-y-4 border-t border-ink/10 bg-paper/60 p-6">
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
              <p className="text-xs text-ink2">This also counts as your vote. No sign-up needed.</p>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn-primary" disabled={status.state === 'busy'}>
                  {status.state === 'busy' ? 'Saving…' : 'Add my story'}
                </button>
              </div>
            </div>
          </form>
        )}

        {status.state === 'done' && <p className="border-t border-ink/10 px-6 py-3 text-sm text-moss">{status.message}</p>}

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
