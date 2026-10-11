'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { INDUSTRIES, LIMITS } from '@/lib/constants';
import { COUNTRIES, prettyName } from '@/lib/geo';

export default function ProblemForm({ defaultCountry, email: knownEmail = '' }) {
  const router = useRouter();
  const started = useRef(0);
  const [form, setForm] = useState({
    title: '',
    details: '',
    industry: '',
    solution: '',
    country: defaultCountry,
    author: '',
    email: knownEmail,
    website: '',
  });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [similar, setSimilar] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    started.current = Date.now();
  }, []);

  // "Might it already be on Atlas?" Look for similar problems as people type.
  useEffect(() => {
    const text = `${form.title} ${form.details}`.trim();
    if (form.title.trim().length < 12) {
      setSimilar([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/problems/similar?q=${encodeURIComponent(text.slice(0, 300))}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        setSimilar(data.problems || []);
      } catch {}
    }, 450);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [form.title, form.details]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, t: started.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      // Straight to the new problem: who's solving it, and a nudge to share.
      router.push(`/problems/${data.id}?new=1${form.email ? '&following=1' : ''}`);
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <form onSubmit={submit} className="card mt-8 space-y-5 p-6 sm:p-8">
      <div>
        <label className="label" htmlFor="title">The problem *</label>
        <input
          id="title"
          className="input mt-2"
          placeholder="e.g. Small clinics in tier-3 towns can't keep track of medicine stock"
          value={form.title}
          onChange={set('title')}
          minLength={LIMITS.titleMin}
          maxLength={LIMITS.titleMax}
          required
        />
        {similar.length > 0 && !dismissed && (
          <div className="mt-3 rounded-lg border border-signal/30 bg-signal/5 p-4">
            <p className="text-sm font-semibold">Someone may have raised this already. Is it one of these?</p>
            <p className="text-xs text-ink2">Backing an existing problem adds your voice to it instead of splitting the count.</p>
            <ul className="mt-3 space-y-2">
              {similar.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-paper p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="font-mono text-[10px] uppercase text-ink2">
                      {p.industry} · {prettyName(p.country)} · ▲ {p.votes} face it
                    </p>
                  </div>
                  <Link href={`/problems/${p.id}#proof`} className="btn-primary shrink-0 px-3 py-1.5 text-xs">
                    I face this →
                  </Link>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-3 text-xs font-semibold text-ink2 underline hover:text-ink" onClick={() => setDismissed(true)}>
              None of these. Mine is different.
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="label" htmlFor="details">More context (optional)</label>
        <textarea
          id="details"
          rows={3}
          className="input mt-2"
          placeholder="Who faces it, how often, what it costs them"
          value={form.details}
          onChange={set('details')}
          maxLength={LIMITS.detailsMax}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="industry">Industry *</label>
          <select id="industry" className="input mt-2" value={form.industry} onChange={set('industry')} required>
            <option value="" disabled>Choose one</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="country">Where *</label>
          <select id="country" className="input mt-2" value={form.country} onChange={set('country')} required>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{prettyName(c)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="solution">How would you solve it? *</label>
        <textarea
          id="solution"
          rows={4}
          className="input mt-2"
          placeholder="Your idea, even if rough"
          value={form.solution}
          onChange={set('solution')}
          minLength={LIMITS.solutionMin}
          maxLength={LIMITS.solutionMax}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="author">Your name (optional)</label>
        <input
          id="author"
          className="input mt-2"
          placeholder="Shown next to your problem"
          value={form.author}
          onChange={set('author')}
          maxLength={LIMITS.nameMax}
        />
      </div>

      <div>
        <label className="label" htmlFor="follow-email">Email me when someone builds this or suggests a fix (optional)</label>
        <input
          id="follow-email"
          type="email"
          className="input mt-2"
          placeholder="you@email.com · never shown, one email per update"
          value={form.email}
          onChange={set('email')}
          maxLength={120}
        />
      </div>

      {/* Honeypot: hidden from people, filled in by bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
      </div>

      {status.state === 'error' && (
        <p className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal">{status.message}</p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status.state === 'busy'}>
        {status.state === 'busy' ? 'Adding…' : 'Put it on the map'}
      </button>
    </form>
  );
}
