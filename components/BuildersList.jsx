'use client';

import { useEffect, useState } from 'react';
import { BUILDER_STAGES, BUILDER_COMMITMENT, BUILDER_NEEDS, SITE } from '@/lib/constants';

const label = (list, key) => list.find(([k]) => k === key)?.[1] || key;

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function IntroForm({ builder, onDone }) {
  const [f, setF] = useState({ name: '', email: '', message: '', hp: '' });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch(`/api/builders/${builder.id}/intro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      onDone();
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }
  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg bg-paper2/50 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" placeholder="Your name *" value={f.name} onChange={set('name')} maxLength={80} required />
        <input className="input" type="email" placeholder="Your email *" value={f.email} onChange={set('email')} maxLength={120} required />
      </div>
      <textarea
        rows={2}
        className="input"
        placeholder={`Why you'd be a good fit for ${builder.first_name}, e.g. co-founder, advisor, first customer`}
        value={f.message}
        onChange={set('message')}
        maxLength={800}
      />
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
      </div>
      {status.state === 'error' && <p className="text-sm text-signal">{status.message}</p>}
      <button className="btn-primary px-4 py-2 text-xs" disabled={status.state === 'busy'}>
        {status.state === 'busy' ? 'Sending…' : 'Ask for an intro'}
      </button>
    </form>
  );
}

function UpdateForm({ builder, onPosted }) {
  const [body, setBody] = useState('');
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch(`/api/builders/${builder.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      onPosted(data.update);
      setBody('');
      setStatus({ state: 'idle', message: '' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }
  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        className="input"
        placeholder="Post a progress update: users spoken to, prototype shipped, first revenue…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={600}
        required
      />
      <button className="btn-primary shrink-0" disabled={status.state === 'busy'}>Post</button>
      {status.state === 'error' && <p className="text-sm text-signal">{status.message}</p>}
    </form>
  );
}

// Public builder cards on a problem: who has claimed it, what they need, their progress.
export default function BuildersList({ initial }) {
  const [builders, setBuilders] = useState(initial);
  const [introFor, setIntroFor] = useState(null);
  const [introSent, setIntroSent] = useState(new Set());
  useEffect(() => setBuilders(initial), [initial]);

  if (builders.length === 0) return null;

  return (
    <section id="builders" className="mt-10 scroll-mt-24">
      <p className="label">Builders on this problem</p>
      <h2 className="mt-1 font-display text-2xl font-semibold">
        {builders.length} {builders.length === 1 ? 'person has' : 'people have'} claimed this
      </h2>
      <ul className="mt-4 space-y-3">
        {builders.map((b) => {
          const needs = (b.needs || '').split(',').filter(Boolean);
          return (
            <li key={b.id} className={`card p-5 ${b.studio_pick ? 'ring-2 ring-signal/50' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {b.first_name}
                    {b.city ? <span className="font-normal text-ink2"> · {b.city}</span> : null}
                    {b.studio_pick && (
                      <span className="ml-2 rounded-full bg-signal px-2 py-0.5 align-middle font-mono text-[9px] uppercase text-white">
                        {SITE.parent} studio pick
                      </span>
                    )}
                    {b.mine && (
                      <span className="ml-2 rounded-full bg-moss/10 px-2 py-0.5 align-middle font-mono text-[9px] uppercase text-moss">You</span>
                    )}
                  </p>
                  {b.headline && <p className="mt-1">{b.headline}</p>}
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink2">
                    {label(BUILDER_STAGES, b.stage)} · {label(BUILDER_COMMITMENT, b.commitment)} · claimed {timeAgo(b.created_at)}
                  </p>
                  {needs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {needs.map((n) => (
                        <span key={n} className={n === 'cofounder' ? 'chip-on' : 'chip'}>
                          {n === 'cofounder' ? '🤝 ' : ''}Needs {label(BUILDER_NEEDS, n).toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {!b.mine &&
                  (introSent.has(b.id) ? (
                    <span className="text-sm font-semibold text-moss">Intro requested ✓</span>
                  ) : (
                    <button className="btn-ghost shrink-0 px-4 py-2 text-xs" onClick={() => setIntroFor(introFor === b.id ? null : b.id)}>
                      {needs.includes('cofounder') ? 'Join as co-founder' : 'Request an intro'}
                    </button>
                  ))}
              </div>

              {introFor === b.id && (
                <IntroForm
                  builder={b}
                  onDone={() => {
                    setIntroSent((s) => new Set(s).add(b.id));
                    setIntroFor(null);
                  }}
                />
              )}

              {b.updates.length > 0 && (
                <ol className="mt-4 space-y-2 border-l-2 border-moss/40 pl-4">
                  {b.updates.map((u) => (
                    <li key={u.id} className="text-sm">
                      <span className="font-mono text-[10px] uppercase text-ink2">{timeAgo(u.created_at)}</span>
                      <p>{u.body}</p>
                    </li>
                  ))}
                </ol>
              )}

              {b.mine && (
                <UpdateForm
                  builder={b}
                  onPosted={(u) =>
                    setBuilders((list) => list.map((x) => (x.id === b.id ? { ...x, updates: [u, ...x.updates] } : x)))
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink2">
        Contact details stay private. The {SITE.parent} team makes every introduction. Each quarter the studio backs the
        best-validated claims.
      </p>
    </section>
  );
}
