'use client';

import { useState } from 'react';

export default function InviteCard({ initial, siteUrl }) {
  const [invite, setInvite] = useState(initial);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [honey, setHoney] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, website: honey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setInvite(data.invite);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!invite) {
    return (
      <form onSubmit={create} className="card space-y-4 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Get your invite code</h2>
        <div>
          <label className="label" htmlFor="inv-name">Your name *</label>
          <input
            id="inv-name"
            className="input mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Shown on the inviter board"
            maxLength={60}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="inv-email">Email (optional)</label>
          <input
            id="inv-email"
            type="email"
            className="input mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Only if you want updates. Never shown."
          />
        </div>
        <div className="hidden" aria-hidden="true">
          <input tabIndex={-1} autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} />
        </div>
        {error && <p className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create my code'}</button>
      </form>
    );
  }

  const link = `${siteUrl}/r/${invite.code}`;
  const message = `I'm mapping the world's unsolved problems on Atlas. Add one you see and vote on what matters: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <div className="card p-6 sm:p-8">
      <p className="label">Your code, {invite.name}</p>
      <p className="mt-2 font-mono text-5xl font-semibold tracking-[0.2em] text-ink">{invite.code}</p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={link} className="input font-mono text-sm" onFocus={(e) => e.target.select()} />
        <button onClick={copy} className="btn-primary shrink-0">{copied ? 'Copied ✓' : 'Copy link'}</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a className="btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(message)}`}>
          WhatsApp
        </a>
        <a
          className="btn-ghost"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`}
        >
          LinkedIn
        </a>
        <a className="btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://x.com/intent/post?text=${encodeURIComponent(message)}`}>
          X
        </a>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-ink/10 pt-6">
        {[
          ['Link visits', invite.visits],
          ['Joined', invite.joined],
          ['Problems added', invite.problems],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="label">{label}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold">{value ?? 0}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
