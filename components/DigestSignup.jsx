'use client';

import { useState } from 'react';
import { INDUSTRIES } from '@/lib/constants';
import { COUNTRIES, prettyName } from '@/lib/geo';

// "Get the weekly digest": top unsolved problems for a country and industries.
// Double opt-in: the person confirms through an emailed link, which also signs them in.
export default function DigestSignup({ defaultCountry = 'India', defaultIndustry = null, email: knownEmail = '', compact = false }) {
  const [email, setEmail] = useState(knownEmail);
  const [country, setCountry] = useState(defaultCountry);
  const [industries, setIndustries] = useState(defaultIndustry ? [defaultIndustry] : []);
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const toggle = (i) => setIndustries((list) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i].slice(-6)));

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, hp, next: '/me', digest: { country, industries } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus({
        state: 'done',
        message: data.saved ? 'Saved. Your digest arrives every Monday morning.' : `Check ${email} and tap the link to confirm.`,
      });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <p className="label">Weekly digest</p>
      <p className={compact ? 'text-sm font-semibold' : 'font-display text-xl font-semibold'}>
        Top unsolved problems in {prettyName(country)}, every Monday
      </p>
      {!compact && (
        <p className="text-sm text-ink2">New problems, the most-wanted fixes, and gaps where no startup is building yet.</p>
      )}
      {status.state === 'done' ? (
        <p className="text-sm font-semibold text-moss">{status.message}</p>
      ) : (
        <>
          <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120} />
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
            {COUNTRIES.map((c) => <option key={c} value={c}>{prettyName(c)}</option>)}
          </select>
          {!compact && (
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.filter((i) => i !== 'Other').map((i) => (
                <button type="button" key={i} onClick={() => toggle(i)} className={industries.includes(i) ? 'chip-on' : 'chip'}>
                  {i}
                </button>
              ))}
            </div>
          )}
          <div className="hidden" aria-hidden="true">
            <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
          </div>
          {status.state === 'error' && <p className="text-sm text-signal">{status.message}</p>}
          <button className="btn-primary w-full" disabled={status.state === 'busy'}>
            {status.state === 'busy' ? 'Sending…' : 'Get the digest'}
          </button>
          <p className="text-xs text-ink2">One email a week. Unsubscribe in one click.</p>
        </>
      )}
    </form>
  );
}
