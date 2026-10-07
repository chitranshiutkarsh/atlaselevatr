'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { INDUSTRIES, JOB_SOURCES, MAX_ACTIVE_JOBS } from '@/lib/constants';
import { COUNTRIES, prettyName } from '@/lib/geo';

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
const EMPTY_CO = { name: '', country: 'India', industry: 'Fintech', problem: '', website: '' };

export default function AdminPanel({ problems, jobs, companies }) {
  const router = useRouter();
  const [tab, setTab] = useState('jobs');
  const [job, setJob] = useState(EMPTY_JOB);
  const [co, setCo] = useState(EMPTY_CO);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const activeJobs = jobs.filter((j) => j.active).length;

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
    ['jobs', `Jobs (${activeJobs}/${MAX_ACTIVE_JOBS})`],
    ['problems', `Problems (${problems.length})`],
    ['companies', `Unicorns (${companies.length})`],
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
            <p className="font-semibold">Add or update a unicorn</p>
            <input className="input" placeholder="Company name *" value={co.name} onChange={(e) => setCo({ ...co, name: e.target.value })} required />
            <select className="input" value={co.country} onChange={(e) => setCo({ ...co, country: e.target.value })}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{prettyName(c)}</option>)}
            </select>
            <select className="input" value={co.industry} onChange={(e) => setCo({ ...co, industry: e.target.value })}>
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
            <textarea className="input" rows={3} placeholder="Problem it solves *" value={co.problem} onChange={(e) => setCo({ ...co, problem: e.target.value })} required />
            <input className="input" placeholder="Website (optional)" value={co.website} onChange={(e) => setCo({ ...co, website: e.target.value })} />
            <button className="btn-primary w-full" disabled={busy}>Save</button>
            <p className="text-xs text-ink2">Same name as an existing one updates it.</p>
          </form>
          <ul className="space-y-2">
            {companies.map((c) => (
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
                      setCo({ name: c.name, country: c.country, industry: c.industry, problem: c.problem, website: c.website || '' });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="chip hover:border-signal hover:text-signal"
                    disabled={busy}
                    onClick={() => confirm(`Remove ${c.name}?`) && run(() => call(`/api/admin/companies/${c.id}`, 'DELETE'))}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
