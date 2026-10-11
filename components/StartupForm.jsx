'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { INDUSTRIES } from '@/lib/constants';
import { COUNTRIES, prettyName } from '@/lib/geo';

const EMPTY = { name: '', problem: '', industry: '', sector: '', country: 'India', city: '', website: '', founded: '', submitter: '', contact: '', hp: '' };

// The one "add a startup" form. On its own page it lists a startup in the
// directory; given a `problem` it also links the startup to that problem
// (a startup already on Atlas is linked at once, a new one after review).
export default function StartupForm({ problem = null }) {
  const started = useRef(0);
  const initial = problem ? { ...EMPTY, industry: problem.industry, country: problem.country } : EMPTY;
  const [f, setF] = useState(initial);
  const [more, setMore] = useState(!problem);
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
        body: JSON.stringify({ ...f, problem_id: problem?.id || null, t: started.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus({ state: 'done', linked: data.linked, existing: data.updatesExisting, name: data.name || f.name });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  function reset() {
    setF(initial);
    started.current = Date.now();
    setStatus({ state: 'idle', message: '' });
  }

  if (status.state === 'done') {
    return (
      <div className={`card ${problem ? 'p-5' : 'mt-8 p-8'}`}>
        <p className="label text-moss">{status.linked ? 'Linked' : 'Received'}</p>
        <h2 className={`mt-2 font-display font-semibold ${problem ? 'text-xl' : 'text-3xl'}`}>
          {status.linked ? `${status.name} is now linked to this problem.` : "Thanks, we'll review it shortly."}
        </h2>
        <p className="mt-2 text-sm text-ink2">
          {status.linked
            ? 'It was already in the directory, so it shows up here straight away.'
            : status.existing
              ? `${status.name} is already listed, so we'll update its details once approved.`
              : `${status.name} joins the directory${problem ? ' and this problem' : ''} once approved, usually within a day.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {!problem && <Link href="/startups" className="btn-primary">Browse startups</Link>}
          <button className="btn-ghost" onClick={reset}>Add another</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`card space-y-4 ${problem ? 'p-5' : 'mt-8 p-6 sm:p-8'}`}>
      {problem && (
        <div>
          <p className="label">Know a startup solving this?</p>
          <p className="mt-1 text-sm text-ink2">Already on Atlas? Just the name links it. New ones join the directory after a quick review.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="s-name">Startup name *</label>
          <input id="s-name" className="input mt-1.5" value={f.name} onChange={set('name')} maxLength={100} required />
        </div>
        <div>
          <label className="label" htmlFor="s-web">Website</label>
          <input id="s-web" className="input mt-1.5" placeholder="example.com" value={f.website} onChange={set('website')} maxLength={300} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="s-problem">What does it do?{problem ? ' (needed if it’s new to Atlas)' : ' *'}</label>
        <textarea
          id="s-problem"
          rows={problem ? 2 : 3}
          className="input mt-1.5"
          placeholder="e.g. Retail investors lack unbiased research to pick stocks and funds"
          value={f.problem}
          onChange={set('problem')}
          minLength={problem ? undefined : 15}
          maxLength={400}
          required={!problem}
        />
      </div>
      {problem && !more && (
        <button type="button" className="text-xs font-semibold text-ink2 underline hover:text-ink" onClick={() => setMore(true)}>
          + Category, city, founded year
        </button>
      )}
      {more && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-ind">Category *</label>
            <select id="s-ind" className="input mt-1.5" value={f.industry} onChange={set('industry')} required>
              <option value="" disabled>Choose one</option>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="s-sector">Sector</label>
            <input id="s-sector" className="input mt-1.5" placeholder="e.g. WealthTech" value={f.sector} onChange={set('sector')} maxLength={60} />
          </div>
          <div>
            <label className="label" htmlFor="s-country">Country *</label>
            <select id="s-country" className="input mt-1.5" value={f.country} onChange={set('country')}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{prettyName(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="s-city">City</label>
            <input id="s-city" className="input mt-1.5" placeholder="e.g. Hyderabad" value={f.city} onChange={set('city')} maxLength={60} />
          </div>
          <div>
            <label className="label" htmlFor="s-founded">Founded (year)</label>
            <input id="s-founded" type="number" min="1950" max="2100" className="input mt-1.5" value={f.founded} onChange={set('founded')} />
          </div>
          <div>
            <label className="label" htmlFor="s-sub">Your name</label>
            <input id="s-sub" className="input mt-1.5" value={f.submitter} onChange={set('submitter')} maxLength={60} />
          </div>
        </div>
      )}
      {!problem && (
        <div>
          <label className="label" htmlFor="s-contact">Email or phone (only seen by our team)</label>
          <input id="s-contact" className="input mt-1.5" value={f.contact} onChange={set('contact')} maxLength={120} />
        </div>
      )}
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
      </div>
      {status.state === 'error' && <p className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal">{status.message}</p>}
      <button className="btn-primary" disabled={status.state === 'busy'}>
        {status.state === 'busy' ? 'Sending…' : problem ? 'Add startup' : 'Submit for review'}
      </button>
    </form>
  );
}
