'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { INDUSTRIES, LIMITS } from '@/lib/constants';
import { COUNTRIES, prettyName } from '@/lib/geo';

export default function ProblemForm({ defaultCountry }) {
  const started = useRef(0);
  const [form, setForm] = useState({
    title: '',
    details: '',
    industry: '',
    solution: '',
    country: defaultCountry,
    author: '',
    website: '',
  });
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  useEffect(() => {
    started.current = Date.now();
  }, []);

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
      setStatus({ state: 'done', message: '' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  if (status.state === 'done') {
    return (
      <div className="card mt-8 p-8">
        <p className="label text-moss">Live now</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Your problem is on the map.</h2>
        <p className="mt-2 text-ink2">Get people to vote for it. Share your invite link so the votes count toward you.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/problems?sort=new" className="btn-primary">See it on the leaderboard</Link>
          <Link href="/invite" className="btn-ghost">Get my invite link</Link>
          <button
            className="btn-ghost"
            onClick={() => {
              setForm((f) => ({ ...f, title: '', details: '', solution: '' }));
              started.current = Date.now();
              setStatus({ state: 'idle', message: '' });
            }}
          >
            Add another
          </button>
        </div>
      </div>
    );
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
