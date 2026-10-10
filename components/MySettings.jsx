'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { INDUSTRIES } from '@/lib/constants';
import { COUNTRIES, prettyName } from '@/lib/geo';

// Digest settings and sign-out on "My Atlas".
export default function MySettings({ digest }) {
  const router = useRouter();
  const [active, setActive] = useState(Boolean(digest?.active));
  const [country, setCountry] = useState(digest?.country || 'India');
  const [industries, setIndustries] = useState(digest?.industries || []);
  const [msg, setMsg] = useState('');
  const toggle = (i) => setIndustries((list) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i].slice(-6)));

  async function save(body, done) {
    setMsg('');
    const res = await fetch('/api/digest/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg(data.error || 'Could not save');
    setActive(data.active);
    setMsg(done);
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <p className="label">Weekly digest</p>
        <p className="mt-1 text-sm">{active ? `On: top problems in ${prettyName(country)}, every Monday.` : 'Off.'}</p>
      </div>
      <select className="input" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
        {COUNTRIES.map((c) => <option key={c} value={c}>{prettyName(c)}</option>)}
      </select>
      <div className="flex flex-wrap gap-1.5">
        {INDUSTRIES.filter((i) => i !== 'Other').map((i) => (
          <button type="button" key={i} onClick={() => toggle(i)} className={industries.includes(i) ? 'chip-on' : 'chip'}>{i}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => save({ country, industries }, 'Saved. The next digest uses these settings.')}>
          {active ? 'Save digest settings' : 'Turn digest on'}
        </button>
        {active && <button className="btn-ghost" onClick={() => save({ active: false }, 'Digest switched off.')}>Turn off</button>}
      </div>
      {msg && <p className="text-sm text-moss">{msg}</p>}
      <hr className="border-ink/10" />
      <button onClick={signOut} className="text-sm text-ink2 underline hover:text-ink">Sign out</button>
    </div>
  );
}
