'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { INDUSTRIES } from '@/lib/constants';
import { COUNTRIES, prettyName } from '@/lib/geo';

const EMPTY = { name: '', problem: '', industry: '', sector: '', country: 'India', city: '', website: '', founded: '', submitter: '', contact: '', hp: '' };

export default function StartupForm() {
  const started = useRef(0);
  const [f, setF] = useState(EMPTY);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch('/api/companies/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, t: started.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus({ state: 'done', message: data.updatesExisting ? 'update' : 'new' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  if (status.state === 'done') {
    return (
      <div className="card mt-8 p-8">
        <p className="label text-moss">Received</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Thanks, we&apos;ll review it shortly.</h2>
        <p className="mt-2 text-ink2">
          {status.message === 'update'
            ? `${f.name} is already listed, so we'll update its details once approved.`
            : `${f.name} will appear in the directory once approved.`}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/startups" className="btn-primary">Browse startups</Link>
          <button
            className="btn-ghost"
            onClick={() => {
              setF(EMPTY);
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
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="s-name">Startup name *</label>
          <input id="s-name" className="input mt-2" value={f.name} onChange={set('name')} maxLength={100} required />
        </div>
        <div>
          <label className="label" htmlFor="s-web">Website</label>
          <input id="s-web" className="input mt-2" placeholder="example.com" value={f.website} onChange={set('website')} maxLength={300} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="s-problem">What problem does it solve? *</label>
        <textarea
          id="s-problem"
          rows={3}
          className="input mt-2"
          placeholder="e.g. Retail investors lack unbiased research to pick stocks and funds"
          value={f.problem}
          onChange={set('problem')}
          minLength={15}
          maxLength={400}
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="s-ind">Category *</label>
          <select id="s-ind" className="input mt-2" value={f.industry} onChange={set('industry')} required>
            <option value="" disabled>Choose one</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="s-sector">Sector</label>
          <input id="s-sector" className="input mt-2" placeholder="e.g. WealthTech" value={f.sector} onChange={set('sector')} maxLength={60} />
        </div>
        <div>
          <label className="label" htmlFor="s-country">Country *</label>
          <select id="s-country" className="input mt-2" value={f.country} onChange={set('country')}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{prettyName(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="s-city">City</label>
          <input id="s-city" className="input mt-2" placeholder="e.g. Hyderabad" value={f.city} onChange={set('city')} maxLength={60} />
        </div>
        <div>
          <label className="label" htmlFor="s-founded">Founded (year)</label>
          <input id="s-founded" type="number" min="1950" max="2100" className="input mt-2" value={f.founded} onChange={set('founded')} />
        </div>
        <div>
          <label className="label" htmlFor="s-sub">Your name</label>
          <input id="s-sub" className="input mt-2" value={f.submitter} onChange={set('submitter')} maxLength={60} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="s-contact">Email or phone (only seen by our team)</label>
        <input id="s-contact" className="input mt-2" value={f.contact} onChange={set('contact')} maxLength={120} />
      </div>
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
      </div>
      {status.state === 'error' && <p className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal">{status.message}</p>}
      <button className="btn-primary" disabled={status.state === 'busy'}>
        {status.state === 'busy' ? 'Sending…' : 'Submit for review'}
      </button>
    </form>
  );
}
