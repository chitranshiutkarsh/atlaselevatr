'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { INDUSTRIES, JOB_SOURCES, MAX_ACTIVE_JOBS, LEAD_STATUSES, BUILDER_STAGES, BUILDER_COMMITMENT, BUILDER_NEEDS } from '@/lib/constants';
import { COUNTRIES, prettyName } from '@/lib/geo';
import CsvImport from './CsvImport';

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

const EMPTY_JOB = { title: '', company: '', location: '', source: 'LinkedIn', url: '', focus: '' };
const EMPTY_CO = { name: '', country: 'India', industry: 'Fintech', problem: '', website: '', city: '', sector: '', is_unicorn: false };

export default function AdminPanel({ problems, jobs, companies, companyTotal, submissions = [], comments = [], leads = [], proofs = [], intros = [] }) {
  const router = useRouter();
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const [tab, setTab] = useState(newLeads ? 'leads' : submissions.length ? 'submissions' : 'jobs');
  const [leadFilter, setLeadFilter] = useState('all');
  const [noteDraft, setNoteDraft] = useState({});
  const [job, setJob] = useState(EMPTY_JOB);
  const [co, setCo] = useState(EMPTY_CO);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const activeJobs = jobs.filter((j) => j.active).length;
  const [coSearch, setCoSearch] = useState('');
  const [coResults, setCoResults] = useState(null);

  async function searchCompanies(e) {
    e.preventDefault();
    if (!coSearch.trim()) return setCoResults(null);
    const r = await fetch(`/api/companies?q=${encodeURIComponent(coSearch.trim())}&limit=60&_=${Date.now()}`);
    const d = await r.json().catch(() => ({ companies: [] }));
    setCoResults(d.companies || []);
  }
  const shownCompanies = coResults || companies;

  async function run(fn, success) {
    setBusy(true);
    setMsg('');
    try {
      await fn();
      if (success) setMsg(success);
      router.refresh();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    ['leads', `🚀 Builders (${newLeads} new / ${leads.length})`],
    ['intros', `🤝 Intro requests (${intros.filter((i) => i.status === 'new').length} new)`],
    ['submissions', `Startup submissions (${submissions.length})`],
    ['proofs', `🙋 Stories (${proofs.length})`],
    ['jobs', `Jobs (${activeJobs}/${MAX_ACTIVE_JOBS})`],
    ['problems', `Problems (${problems.length})`],
    ['comments', `Comments (${comments.length})`],
    ['companies', `Startups (${companyTotal.toLocaleString('en-IN')})`],
  ];

  return (
    <div className="pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Admin</h1>
        <button
          className="btn-ghost"
          onClick={() => run(() => call('/api/admin/logout', 'POST'))}
        >
          Sign out
        </button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={tab === key ? 'chip-on' : 'chip'}>
            {label}
          </button>
        ))}
      </div>
      {msg && <p className="mt-4 rounded-lg bg-paper2 px-4 py-2 text-sm">{msg}</p>}

      {tab === 'jobs' && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <form
            className="card h-fit space-y-3 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await call('/api/admin/jobs', 'POST', job);
                setJob(EMPTY_JOB);
              }, 'Job added');
            }}
          >
            <p className="font-semibold">Add a job</p>
            <input className="input" placeholder="Job title *" value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} required />
            <input className="input" placeholder="Company *" value={job.company} onChange={(e) => setJob({ ...job, company: e.target.value })} required />
            <input className="input" placeholder="Location" value={job.location} onChange={(e) => setJob({ ...job, location: e.target.value })} />
            <select className="input" value={job.source} onChange={(e) => setJob({ ...job, source: e.target.value })}>
              {JOB_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input className="input" placeholder="Apply link (https://…) *" value={job.url} onChange={(e) => setJob({ ...job, url: e.target.value })} required />
            <input className="input" placeholder="What problem does this role solve?" value={job.focus} onChange={(e) => setJob({ ...job, focus: e.target.value })} />
            <button className="btn-primary w-full" disabled={busy || activeJobs >= MAX_ACTIVE_JOBS}>
              {activeJobs >= MAX_ACTIVE_JOBS ? 'Board full (50)' : 'Add job'}
            </button>
          </form>
          <ul className="space-y-2">
            {jobs.length === 0 && <li className="text-ink2">No jobs yet.</li>}
            {jobs.map((j) => (
              <li key={j.id} className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${j.active ? '' : 'opacity-50'}`}>
                <div className="min-w-0">
                  <p className="font-semibold">{j.title} · <span className="font-normal">{j.company}</span></p>
                  <a href={j.url} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-xs text-ink2 hover:text-signal">
                    {j.source} · {j.url}
                  </a>
                </div>
                <div className="flex gap-2">
                  <button className="chip" disabled={busy} onClick={() => run(() => call(`/api/admin/jobs/${j.id}`, 'PATCH', { active: !j.active }))}>
                    {j.active ? 'Pause' : 'Make live'}
                  </button>
                  <button
                    className="chip hover:border-signal hover:text-signal"
                    disabled={busy}
                    onClick={() => confirm('Delete this job?') && run(() => call(`/api/admin/jobs/${j.id}`, 'DELETE'))}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'leads' && (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {['all', ...LEAD_STATUSES].map((st) => (
                <button key={st} onClick={() => setLeadFilter(st)} className={leadFilter === st ? 'chip-on' : 'chip'}>
                  {st} ({st === 'all' ? leads.length : leads.filter((l) => l.status === st).length})
                </button>
              ))}
            </div>
            <a href="/api/admin/builders/export" className="btn-ghost">Download CSV</a>
          </div>
          <ul className="mt-4 space-y-3">
            {leads.length === 0 && <li className="text-ink2">No builders yet. They appear here when someone taps “Want to build this?” on a problem.</li>}
            {leads
              .filter((l) => leadFilter === 'all' || l.status === leadFilter)
              .map((l) => (
                <li key={l.id} className={`card p-4 ${l.status === 'new' ? 'ring-2 ring-signal/30' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {l.name} <span className="font-mono text-xs font-normal text-ink2">· {new Date(l.created_at).toLocaleDateString('en-IN')}{l.city ? ` · ${l.city}` : ''}</span>
                      </p>
                      <p className="mt-0.5 font-mono text-xs">
                        <a href={`mailto:${l.email}`} className="underline">{l.email}</a>
                        {l.phone && <> · <a href={`https://wa.me/${l.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="underline">{l.phone}</a></>}
                        {l.linkedin && <> · <a href={l.linkedin} target="_blank" rel="noopener noreferrer" className="underline">LinkedIn</a></>}
                      </p>
                      <p className="mt-1 text-sm">
                        wants to build{' '}
                        <a href={`/problems/${l.problem_id}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{l.problem}</a>
                        <span className="text-ink2"> ({l.votes} votes)</span>
                      </p>
                      <p className="mt-1 font-mono text-[11px] uppercase text-ink2">
                        {(BUILDER_STAGES.find(([k]) => k === l.stage) || [, l.stage])[1]} · {(BUILDER_COMMITMENT.find(([k]) => k === l.commitment) || [, l.commitment])[1]}
                        {l.needs ? ` · needs: ${l.needs.split(',').map((n) => (BUILDER_NEEDS.find(([k]) => k === n) || [, n])[1]).join(', ')}` : ''}
                      </p>
                      {l.pitch && <p className="mt-2 whitespace-pre-line rounded-lg bg-paper2/60 p-3 text-sm">{l.pitch}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="input w-auto py-1.5 text-sm"
                        value={l.status}
                        disabled={busy}
                        onChange={(e) => run(() => call(`/api/admin/builders/${l.id}`, 'PATCH', { status: e.target.value }))}
                      >
                        {LEAD_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                      <button
                        className="chip hover:border-signal hover:text-signal"
                        disabled={busy}
                        onClick={() => confirm(`Delete ${l.name}'s entry?`) && run(() => call(`/api/admin/builders/${l.id}`, 'DELETE'))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="input py-1.5 text-sm"
                      placeholder="Private notes (call scheduled, intro sent…)"
                      value={noteDraft[l.id] ?? l.notes ?? ''}
                      onChange={(e) => setNoteDraft((d) => ({ ...d, [l.id]: e.target.value }))}
                    />
                    <button
                      className="chip shrink-0"
                      disabled={busy || noteDraft[l.id] === undefined}
                      onClick={() => run(() => call(`/api/admin/builders/${l.id}`, 'PATCH', { notes: noteDraft[l.id] }), 'Note saved')}
                    >
                      Save note
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      )}

      {tab === 'submissions' && (
        <ul className="mt-6 space-y-2">
          {submissions.length === 0 && <li className="text-ink2">No startups waiting for review.</li>}
          {submissions.map((sub) => (
            <li key={sub.id} className="card flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {sub.name}{' '}
                  <span className="font-mono text-xs font-normal text-ink2">
                    · {[sub.city, prettyName(sub.country), sub.industry, sub.sector, sub.founded].filter(Boolean).join(' · ')}
                  </span>
                </p>
                <p className="mt-1 text-sm">{sub.problem}</p>
                {sub.for_problem && (
                  <p className="mt-1 text-xs text-moss">
                    Suggested as solving: <a href={`/problems/${sub.problem_id}`} target="_blank" rel="noopener noreferrer" className="underline">{sub.for_problem}</a>
                  </p>
                )}
                <p className="mt-1 font-mono text-xs text-ink2">
                  {sub.website && (
                    <a href={sub.website} target="_blank" rel="noopener noreferrer" className="hover:text-signal">{sub.website}</a>
                  )}
                  {sub.submitter ? ` · by ${sub.submitter}` : ''}
                  {sub.contact ? ` · ${sub.contact}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="chip-on" disabled={busy} onClick={() => run(() => call(`/api/admin/submissions/${sub.id}`, 'PATCH', { action: 'approve' }), `${sub.name} is live`)}>
                  Approve
                </button>
                <button className="chip hover:border-signal hover:text-signal" disabled={busy} onClick={() => run(() => call(`/api/admin/submissions/${sub.id}`, 'PATCH', { action: 'reject' }))}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'intros' && (
        <ul className="mt-6 space-y-2">
          {intros.length === 0 && <li className="text-ink2">No intro requests yet. They appear when someone asks to join a public builder.</li>}
          {intros.map((i) => (
            <li key={i.id} className={`card flex flex-wrap items-start justify-between gap-3 p-4 ${i.status === 'new' ? '' : 'opacity-60'}`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {i.name} <span className="font-mono text-xs font-normal text-ink2">· <a href={`mailto:${i.email}`} className="underline">{i.email}</a></span>
                </p>
                <p className="mt-1 text-sm">
                  wants an intro to <span className="font-semibold">{i.builder}</span> (<a href={`mailto:${i.builder_email}`} className="underline">{i.builder_email}</a>) on{' '}
                  <a href={`/problems/${i.problem_id}#builders`} target="_blank" rel="noopener noreferrer" className="underline">{i.problem}</a>
                </p>
                {i.message && <p className="mt-1 whitespace-pre-line text-sm text-ink2">“{i.message}”</p>}
              </div>
              <select
                className="input w-auto"
                value={i.status}
                disabled={busy}
                onChange={(e) => run(() => call(`/api/admin/intros/${i.id}`, 'PATCH', { status: e.target.value }))}
              >
                {['new', 'introduced', 'declined'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}

      {tab === 'proofs' && (
        <ul className="mt-6 space-y-2">
          {proofs.length === 0 && <li className="text-ink2">No stories yet.</li>}
          {proofs.map((pr) => (
            <li key={pr.id} className={`card flex flex-wrap items-start justify-between gap-3 p-4 ${pr.status === 'live' ? '' : 'opacity-50'}`}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-ink2">
                  {pr.author || 'anonymous'}{pr.city ? ` · ${pr.city}` : ''} · {pr.frequency} · pay: {pr.pay} · {pr.who} · on{' '}
                  <a href={`/problems/${pr.problem_id}`} target="_blank" rel="noopener noreferrer" className="underline">{pr.problem}</a>
                </p>
                <p className="mt-1 text-sm">{pr.story}</p>
              </div>
              <button
                className="chip"
                disabled={busy}
                onClick={() => run(() => call(`/api/admin/proofs/${pr.id}`, 'PATCH', { status: pr.status === 'live' ? 'hidden' : 'live' }))}
              >
                {pr.status === 'live' ? 'Hide' : 'Show'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === 'comments' && (
        <ul className="mt-6 space-y-2">
          {comments.length === 0 && <li className="text-ink2">No comments yet.</li>}
          {comments.map((c) => (
            <li key={c.id} className={`card flex flex-wrap items-start justify-between gap-3 p-4 ${c.status === 'live' ? '' : 'opacity-50'}`}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-ink2">
                  {c.kind} · {c.author || 'anonymous'} · 👍 {c.helpful} · on{' '}
                  <a href={`/problems/${c.problem_id}`} target="_blank" rel="noopener noreferrer" className="underline">{c.problem}</a>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm">{c.body}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="chip"
                  disabled={busy}
                  onClick={() => run(() => call(`/api/admin/comments/${c.id}`, 'PATCH', { status: c.status === 'live' ? 'hidden' : 'live' }))}
                >
                  {c.status === 'live' ? 'Hide' : 'Show'}
                </button>
                <button
                  className="chip hover:border-signal hover:text-signal"
                  disabled={busy}
                  onClick={() => confirm('Delete this comment?') && run(() => call(`/api/admin/comments/${c.id}`, 'DELETE'))}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'problems' && (
        <ul className="mt-6 space-y-2">
          {problems.length === 0 && <li className="text-ink2">No problems submitted yet.</li>}
          {problems.map((p) => (
            <li key={p.id} className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${p.status === 'live' ? '' : 'opacity-50'}`}>
              <div className="min-w-0">
                <p className="font-semibold">{p.title}</p>
                <p className="font-mono text-xs text-ink2">
                  {p.votes} votes · {p.industry} · {prettyName(p.country)} · {p.author || 'anonymous'} · {p.status}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="chip"
                  disabled={busy}
                  onClick={() => run(() => call(`/api/admin/problems/${p.id}`, 'PATCH', { status: p.status === 'live' ? 'hidden' : 'live' }))}
                >
                  {p.status === 'live' ? 'Hide' : 'Show'}
                </button>
                <button
                  className="chip hover:border-signal hover:text-signal"
                  disabled={busy}
                  onClick={() => confirm('Delete this problem and its votes?') && run(() => call(`/api/admin/problems/${p.id}`, 'DELETE'))}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'companies' && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="h-fit space-y-4">
          <form
            className="card h-fit space-y-3 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await call('/api/admin/companies', 'POST', co);
                setCo(EMPTY_CO);
              }, 'Saved');
            }}
          >
            <p className="font-semibold">Add or update a startup</p>
            <input className="input" placeholder="Company name *" value={co.name} onChange={(e) => setCo({ ...co, name: e.target.value })} required />
            <select className="input" value={co.country} onChange={(e) => setCo({ ...co, country: e.target.value })}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{prettyName(c)}</option>)}
            </select>
            <select className="input" value={co.industry} onChange={(e) => setCo({ ...co, industry: e.target.value })}>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
            <textarea className="input" rows={3} placeholder="Problem it solves *" value={co.problem} onChange={(e) => setCo({ ...co, problem: e.target.value })} required />
            <input className="input" placeholder="Website (optional)" value={co.website} onChange={(e) => setCo({ ...co, website: e.target.value })} />
            <input className="input" placeholder="City (optional)" value={co.city} onChange={(e) => setCo({ ...co, city: e.target.value })} />
            <input className="input" placeholder="Sector, e.g. Lending (optional)" value={co.sector} onChange={(e) => setCo({ ...co, sector: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={co.is_unicorn} onChange={(e) => setCo({ ...co, is_unicorn: e.target.checked })} />
              Unicorn ($1B+ valuation)
            </label>
            <button className="btn-primary w-full" disabled={busy}>Save</button>
            <p className="text-xs text-ink2">Same name as an existing one updates it.</p>
          </form>
            <CsvImport onDone={(m) => { setMsg(m); router.refresh(); }} />
          </div>
          <div>
          <form onSubmit={searchCompanies} className="mb-3 flex gap-2">
            <input className="input" placeholder="Search all startups by name…" value={coSearch} onChange={(e) => setCoSearch(e.target.value)} />
            <button className="btn-ghost shrink-0">Search</button>
          </form>
          <p className="label mb-2">{coResults ? `${coResults.length} results` : `Showing ${companies.length} unicorns. Search to find any startup.`}</p>
          <ul className="space-y-2">
            {shownCompanies.map((c) => (
              <li key={c.id} className="card flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {c.name} <span className="font-mono text-xs font-normal text-ink2">· {prettyName(c.country)} · {c.industry}</span>
                  </p>
                  <p className="text-sm text-ink2">{c.problem}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="chip"
                    onClick={() => {
                      setCo({ name: c.name, country: c.country, industry: c.industry, problem: c.problem, website: c.website || '', city: c.city || '', sector: c.sector || '', is_unicorn: Boolean(c.is_unicorn) });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="chip hover:border-signal hover:text-signal"
                    disabled={busy}
                    onClick={() =>
                      confirm(`Remove ${c.name}?`) &&
                      run(async () => {
                        await call(`/api/admin/companies/${c.id}`, 'DELETE');
                        setCoResults((r) => (r ? r.filter((x) => x.id !== c.id) : r));
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          </div>
        </section>
      )}
    </div>
  );
}
