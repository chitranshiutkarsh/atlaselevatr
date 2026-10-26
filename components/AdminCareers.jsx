'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ATS_LABEL, boardUrl } from '@/lib/careers-core';

async function call(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Admin → Careers: review boards found automatically or sent by startups,
// add a careers link by hand, and run the import.
export default function AdminCareers({ review = [], live = [], stats = {} }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ company: '', url: '' });

  async function run(fn, success) {
    setBusy(true);
    setMsg('');
    try {
      const out = await fn();
      setMsg(typeof success === 'function' ? success(out) : success || 'Done');
      router.refresh();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  const Board = ({ b, actions }) => (
    <li className="card flex flex-wrap items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="font-semibold">
          {b.name} <span className="font-normal text-ink2">· {b.country}</span>
        </p>
        <a href={boardUrl(b.ats, b.token)} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-xs text-ink2 hover:text-signal">
          {ATS_LABEL[b.ats] || b.ats}: {b.ats === 'link' ? b.token : b.token} ↗
        </a>
        <p className="mt-1 font-mono text-[11px] uppercase text-ink2">
          {b.open_roles} roles · {b.source}
          {b.board_name ? ` · board says “${b.board_name}”` : ''}
          {b.evidence ? ` · ${b.evidence}` : ''}
          {b.submitter ? ` · from ${b.submitter}` : ''}
          {b.last_error ? ` · error: ${b.last_error}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </li>
  );

  return (
    <section className="mt-6 space-y-8">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Open roles', stats.roles],
          ['Startups hiring', stats.hiring],
          ['To review', review.length],
          ['Startups checked', `${(stats.checked || 0).toLocaleString('en-IN')} / ${(stats.companies || 0).toLocaleString('en-IN')}`],
        ].map(([l, v]) => (
          <div key={l} className="card p-4">
            <p className="label">{l}</p>
            <p className="font-display text-2xl font-semibold">{typeof v === 'number' ? v.toLocaleString('en-IN') : v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn-primary"
          disabled={busy}
          onClick={() =>
            run(
              () => call('/api/admin/careers', 'POST', { run: true }),
              (r) => (r.skipped ? `Skipped: ${r.skipped}` : `Import done: ${r.synced} boards refreshed, ${r.checked} startups checked, ${r.discovered} boards found, ${r.roles} open roles.`)
            )
          }
        >
          {busy ? 'Working…' : 'Run import now'}
        </button>
        <span className="text-sm text-ink2">Runs daily on its own. Last run: {stats.last_run ? new Date(stats.last_run).toLocaleString('en-IN') : 'never'}.</span>
      </div>
      {msg && <p className="rounded-lg bg-paper2 px-4 py-2 text-sm">{msg}</p>}

      <form
        className="card grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const r = await call('/api/admin/careers', 'POST', form);
            setForm({ company: '', url: '' });
            return r;
          }, (r) => `${r.company}: ${r.ats === 'link' ? 'careers page linked' : `${r.roles} roles imported`}.`);
        }}
      >
        <input className="input" placeholder="Startup name (as in the directory)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
        <input className="input" placeholder="Careers link, e.g. https://jobs.lever.co/…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
        <button className="btn-primary" disabled={busy}>Add</button>
      </form>

      <div>
        <h2 className="font-display text-2xl font-semibold">To review ({review.length})</h2>
        <p className="mt-1 text-sm text-ink2">
          Boards that might be the right startup&apos;s but didn&apos;t check out on their own (name or country didn&apos;t match), links startups sent, and boards that stopped working.
        </p>
        <ul className="mt-3 space-y-2">
          {review.length === 0 && <li className="text-ink2">Nothing to review.</li>}
          {review.map((b) => (
            <Board
              key={b.company_id}
              b={b}
              actions={
                <>
                  <button className="chip-on" disabled={busy} onClick={() => run(() => call(`/api/admin/careers/${b.company_id}`, 'PATCH', { status: 'verified' }), `${b.name} approved`)}>
                    Approve
                  </button>
                  <button className="chip" disabled={busy} onClick={() => run(() => call(`/api/admin/careers/${b.company_id}`, 'PATCH', { status: 'rejected' }), `${b.name} rejected`)}>
                    Wrong company
                  </button>
                </>
              }
            />
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-display text-2xl font-semibold">Live ({live.length})</h2>
        <ul className="mt-3 space-y-2">
          {live.map((b) => (
            <Board
              key={b.company_id}
              b={b}
              actions={
                <button className="chip hover:border-signal hover:text-signal" disabled={busy} onClick={() => run(() => call(`/api/admin/careers/${b.company_id}`, 'PATCH', { status: 'rejected' }), `${b.name} taken down`)}>
                  Take down
                </button>
              }
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
