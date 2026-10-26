'use client';

import { useState } from 'react';

// A startup adds its careers page so its open roles show on Atlas.
export default function HiringForm() {
  const [f, setF] = useState({ company: '', url: '', email: '', hp: '' });
  const [status, setStatus] = useState({ state: 'idle' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy' });
    try {
      const res = await fetch('/api/hiring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 404 && data.error === 'not_listed') {
        setStatus({ state: 'not_listed', message: data.message });
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus({ state: 'done', ...data });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  if (status.state === 'done') {
    const live = status.status === 'verified';
    return (
      <div className="card p-6">
        <p className={`label ${live ? 'text-moss' : ''}`}>{live ? 'Live on Atlas' : 'Thanks, we’ll check it'}</p>
        <p className="mt-2 font-display text-2xl font-semibold">
          {live
            ? `${status.roles} open role${status.roles === 1 ? '' : 's'} at ${status.company} are now on Atlas.`
            : `We got ${status.company}’s careers page.`}
        </p>
        <p className="mt-2 text-ink2">
          {live
            ? 'They show on the jobs page and on every problem your startup works on. We re-read your board every day, so new roles appear on their own.'
            : status.ats === 'link'
              ? 'Your careers page will be linked from Atlas once we have checked it, usually within a couple of days. To list each role on Atlas automatically, use a Greenhouse, Lever, Ashby, SmartRecruiters or Recruitee link.'
              : 'We could not confirm the board belongs to your startup automatically, so someone will check it, usually within a couple of days.'}
        </p>
        {live && status.companyId && (
          <a href={`/jobs?company=${status.companyId}`} className="btn-primary mt-4">See your roles on Atlas →</a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label htmlFor="h-company" className="text-sm font-semibold">Startup name</label>
        <input id="h-company" className="input mt-1.5" value={f.company} onChange={set('company')} maxLength={100} required placeholder="As it appears on Atlas" />
      </div>
      <div>
        <label htmlFor="h-url" className="text-sm font-semibold">Careers page link</label>
        <input id="h-url" type="url" className="input mt-1.5" value={f.url} onChange={set('url')} maxLength={500} required placeholder="https://jobs.lever.co/yourstartup" />
        <p className="mt-1 text-xs text-ink2">Greenhouse, Lever, Ashby, SmartRecruiters and Recruitee boards import every role. Any other page is linked.</p>
      </div>
      <div>
        <label htmlFor="h-email" className="text-sm font-semibold">Your work email <span className="font-normal text-ink2">(optional)</span></label>
        <input id="h-email" type="email" className="input mt-1.5" value={f.email} onChange={set('email')} maxLength={120} placeholder="you@yourstartup.com" />
      </div>
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
      </div>
      <button className="btn-primary w-full" disabled={status.state === 'busy'}>
        {status.state === 'busy' ? 'Reading your board…' : 'Add careers page'}
      </button>
      {status.state === 'error' && <p className="text-sm text-signal">{status.message}</p>}
      {status.state === 'not_listed' && (
        <p className="text-sm text-signal">
          {status.message}{' '}
          <a href="/startups/add" className="font-semibold underline">List your startup →</a>
        </p>
      )}
    </form>
  );
}
