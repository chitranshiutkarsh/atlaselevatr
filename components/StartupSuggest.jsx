'use client';

import { useEffect, useRef, useState } from 'react';
import { INDUSTRIES } from '@/lib/constants';

const EMPTY = { name: '', website: '', problem: '', industry: '', submitter: '', hp: '' };

// "Know a startup solving this?" Links a startup already in the directory
// right away; a new one is reviewed and then added to the directory.
export default function StartupSuggest({ problemId, defaultIndustry }) {
  const [f, setF] = useState({ ...EMPTY, industry: defaultIndustry });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const started = useRef(0);
  useEffect(() => {
    started.current = Date.now();
  }, []);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch(`/api/problems/${problemId}/startups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, t: started.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus({
        state: 'done',
        message: data.linked
          ? `${data.name} is already in the directory. It's now linked to this problem.`
          : `Thanks. ${data.name} goes live in the startup directory once the team reviews it, usually within a day.`,
      });
      setF({ ...EMPTY, industry: defaultIndustry });
      started.current = Date.now();
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <p className="label">Know a startup solving this?</p>
      <p className="text-sm text-ink2">Add it. If it&apos;s new to Atlas it joins the main startup directory after a quick review.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Startup name *" value={f.name} onChange={set('name')} maxLength={100} required />
        <input className="input" placeholder="Website" value={f.website} onChange={set('website')} maxLength={300} />
      </div>
      <textarea
        rows={2}
        className="input"
        placeholder="What does it do? (needed if it's not on Atlas yet)"
        value={f.problem}
        onChange={set('problem')}
        maxLength={400}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select className="input" value={f.industry} onChange={set('industry')}>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <input className="input" placeholder="Your name (optional)" value={f.submitter} onChange={set('submitter')} maxLength={60} />
      </div>
      <div className="hidden" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
      </div>
      {status.message && <p className={`text-sm ${status.state === 'error' ? 'text-signal' : 'text-moss'}`}>{status.message}</p>}
      <button className="btn-primary" disabled={status.state === 'busy'}>{status.state === 'busy' ? 'Adding…' : 'Add startup'}</button>
    </form>
  );
}
