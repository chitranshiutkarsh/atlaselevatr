import Link from 'next/link';
import SetupNotice from '@/components/SetupNotice';
import RoleCard from '@/components/RoleCard';
import CareButton from '@/components/CareButton';
import JobsRefreshPing from '@/components/JobsRefreshPing';
import { listJobs } from '@/lib/queries';
import { caredProblemIds, listCaredProblems, listRoles, pickerProblems, roleFacets, jobsStats, problemsWithRoles, problemsAwaitingMatches } from '@/lib/roles';
import { getUserId } from '@/lib/auth';
import { getVisitorId } from '@/lib/security';
import { db } from '@/lib/db';
import { ROLE_KINDS } from '@/lib/careers-core';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENT_OF, prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = {
  title: 'Jobs on problems you care about',
  description:
    'Open roles at startups working on the problems people face. Pick the problems you care about and see who is hiring to solve them.',
};

const PAGE = 30;
const KIND_KEYS = ROLE_KINDS.map(([k]) => k);

function href(current, change) {
  const next = { ...current, ...change };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, String(v));
  const qs = params.toString();
  return `/jobs${qs ? `?${qs}` : ''}`;
}

export default async function JobsPage({ searchParams }) {
  const kind = KIND_KEYS.includes(searchParams.kind) ? searchParams.kind : null;
  const country = CONTINENT_OF[searchParams.country] ? searchParams.country : null;
  const industry = INDUSTRIES.includes(searchParams.industry) ? searchParams.industry : null;
  const remote = searchParams.remote === '1';
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim().slice(0, 80) || null : null;
  const problemId = parseInt(searchParams.problem, 10) || null;
  const companyId = parseInt(searchParams.company, 10) || null;
  const page = Math.max(parseInt(searchParams.page, 10) || 1, 1);

  let stats;
  let cared = [];
  let caredList = [];
  let picker = [];
  let facets;
  let result = { roles: [], total: 0 };
  let curated = [];
  let focusProblem = null;
  let focusCompany = null;
  let tab;
  let byProblem = [];
  let awaiting = 0;
  try {
    const visitorId = getVisitorId();
    const userId = getUserId();
    [stats, cared, facets, curated] = await Promise.all([
      jobsStats(),
      caredProblemIds({ visitorId, userId }),
      roleFacets(),
      listJobs().catch(() => []),
    ]);
    tab = problemId || companyId
      ? 'all'
      : ['all', 'problems'].includes(searchParams.tab)
        ? searchParams.tab
        : searchParams.tab === 'for-you' || cared.length
          ? 'for-you'
          : 'all';

    const sql = await db();
    if (problemId) [focusProblem] = await sql`SELECT id, title, votes, cares FROM problems WHERE id = ${problemId} AND status = 'live'`;
    if (companyId) [focusCompany] = await sql`SELECT id, name FROM companies WHERE id = ${companyId}`;

    const focus = focusProblem ? [focusProblem.id] : tab === 'for-you' ? cared : null;
    const filters = { kind, country, remote, industry, q, companyId: focusCompany?.id || null, limit: PAGE, offset: (page - 1) * PAGE };
    if (tab === 'problems') {
      [byProblem, awaiting] = await Promise.all([problemsWithRoles({ q, industry }), problemsAwaitingMatches()]);
    } else if (!(tab === 'for-you' && !focusProblem && cared.length === 0)) {
      result = await listRoles({ ...filters, focus });
    }
    if (tab === 'for-you') {
      [caredList, picker] = await Promise.all([
        listCaredProblems(cared),
        cared.length < 3 ? pickerProblems({ limit: 12 + cared.length }).then((list) => list.filter((p) => !cared.includes(p.id)).slice(0, 12)) : [],
      ]);
    }
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }

  // The tab only goes in links when it isn't the default (For you once someone cares about a problem).
  const defaultTab = cared.length ? 'for-you' : 'all';
  const current = {
    tab: focusProblem || focusCompany || tab === defaultTab ? null : tab,
    kind,
    country,
    remote: remote ? '1' : null,
    industry,
    q,
    problem: focusProblem?.id || null,
    company: focusCompany?.id || null,
  };
  const caredSet = new Set(cared);
  const importing = stats.roles === 0;
  const kindCount = Object.fromEntries(facets.kinds.map((k) => [k.kind, k.n]));
  const pages = Math.ceil(result.total / PAGE);
  const filtered = Boolean(kind || country || remote || industry || q);

  return (
    <div className="pt-12">
      <JobsRefreshPing />
      <p className="label">Jobs</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
        Get paid to work on the problems you <span className="italic text-signal">care about</span>.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink2">
        {importing
          ? 'Open roles come straight from the careers pages of the startups mapped on Atlas, and each one is linked to the problem its company is solving.'
          : (
            <>
              {stats.roles.toLocaleString('en-IN')} open roles at {stats.hiring.toLocaleString('en-IN')} startups working on{' '}
              <Link href="/jobs?tab=problems" className="font-semibold text-ink underline decoration-ink/30 hover:text-signal">
                {stats.problems_with_roles.toLocaleString('en-IN')} problems
              </Link>
              . Each role shows the problem you&apos;d be solving.
            </>
          )}
      </p>

      {focusProblem || focusCompany ? (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <p>
            <span className="label">{focusProblem ? 'Roles working on' : 'Roles at'}</span>{' '}
            {focusProblem ? (
              <Link href={`/problems/${focusProblem.id}`} className="font-semibold hover:text-signal">{focusProblem.title}</Link>
            ) : (
              <span className="font-semibold">{focusCompany.name}</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {focusProblem && <CareButton problemId={focusProblem.id} initialCared={caredSet.has(focusProblem.id)} initialCount={focusProblem.cares} compact refresh />}
            <Link href="/jobs" className="text-sm font-semibold text-signal hover:underline">All jobs</Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap gap-1 border-b border-ink/10">
          {[
            ['for-you', `♥ For you${cared.length ? ` · ${cared.length} problem${cared.length === 1 ? '' : 's'}` : ''}`],
            ['problems', `By problem${stats.problems_with_roles ? ` · ${stats.problems_with_roles}` : ''}`],
            ['all', 'All roles'],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={href({ ...current, problem: null, company: null }, { tab: key, page: null })}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tab === key ? 'border-signal text-ink' : 'border-transparent text-ink2 hover:text-ink'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      {tab === 'for-you' && !focusProblem && (
        <section className="mt-6">
          {caredList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="label mr-1">Your problems</span>
              {caredList.map((p) => (
                <Link key={p.id} href={href({}, { problem: p.id })} className="chip max-w-full">
                  <span className="truncate">♥ {p.title}</span>
                  <span className="ml-1.5 font-mono opacity-70">{p.roles}</span>
                </Link>
              ))}
            </div>
          )}
          {picker.length > 0 && (
            <div className={caredList.length ? 'mt-8' : ''}>
              <h2 className="font-display text-2xl font-semibold">
                {cared.length ? 'Add a few more problems' : 'Start by picking the problems you care about'}
              </h2>
              <p className="mt-1 max-w-2xl text-ink2">
                Tap ♡ on two or three. You&apos;ll see open roles at the startups working on them, here and in your weekly email.
              </p>
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {picker.map((p) => (
                  <li key={p.id} className="card flex flex-col p-4">
                    <Link href={`/problems/${p.id}`} className="font-semibold leading-snug hover:text-signal">{p.title}</Link>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink2">
                      {p.industry} · {prettyName(p.country)} · ▲ {p.votes} face it
                      {p.roles > 0 ? ` · ${p.roles} open role${p.roles === 1 ? '' : 's'}` : ''}
                    </p>
                    <div className="mt-3">
                      <CareButton problemId={p.id} initialCared={caredSet.has(p.id)} initialCount={p.cares} compact refresh />
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/problems" className="mt-3 inline-block text-sm font-semibold text-signal hover:underline">
                Browse every problem →
              </Link>
            </div>
          )}
        </section>
      )}

      {tab === 'problems' && (
        <section className="mt-6">
          <form action="/jobs" method="get" className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="tab" value="problems" />
            <input name="q" defaultValue={q || ''} className="input sm:flex-1" placeholder="Search problems, e.g. health, payments, climate" maxLength={80} aria-label="Search problems" />
            <select name="industry" defaultValue={industry || ''} className="input sm:w-56" aria-label="Area">
              <option value="">Any area</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <button className="btn-primary">Search</button>
          </form>
          <p className="mt-4 text-sm text-ink2">
            {byProblem.length.toLocaleString('en-IN')} problem{byProblem.length === 1 ? '' : 's'} with open roles
            {q || industry ? ' matching your search' : ''}, most roles first.
            {awaiting > 0 ? ` ${awaiting} more problem${awaiting === 1 ? ' is' : 's are'} still being matched to startups.` : ''}
          </p>
          {byProblem.length === 0 ? (
            <div className="card mt-4 p-8">
              <p className="font-display text-2xl font-semibold">{q || industry ? 'No problems match that' : 'Matching problems to hiring startups'}</p>
              <p className="mt-2 max-w-2xl text-ink2">
                {q || industry
                  ? 'Try another search, or browse all roles.'
                  : 'Atlas is linking each problem to the startups working on it and reading their careers pages. This list fills in over the next hour.'}
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {byProblem.map((p) => (
                <li key={p.id} className="card flex min-w-0 flex-col p-5">
                  <Link href={`/problems/${p.id}`} className="font-semibold leading-snug hover:text-signal">{p.title}</Link>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink2">
                    {p.industry} · {prettyName(p.country)}{p.votes > 0 ? ` · ▲ ${p.votes} face it` : ''}
                  </p>
                  <p className="mt-3 text-sm">
                    <span className="font-display text-2xl font-semibold">{p.roles.toLocaleString('en-IN')}</span>{' '}
                    open role{p.roles === 1 ? '' : 's'} at {p.startups} startup{p.startups === 1 ? '' : 's'}
                  </p>
                  {p.companies && <p className="mt-1 truncate text-sm text-ink2">{p.companies}</p>}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <CareButton problemId={p.id} initialCared={caredSet.has(p.id)} initialCount={p.cares} compact />
                    <Link href={href({}, { problem: p.id })} className="btn-primary px-4 py-2">See roles →</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab !== 'problems' && !(tab === 'for-you' && cared.length === 0 && !focusProblem) && (
        <section className="mt-8">
          <form action="/jobs" method="get" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_200px_200px_auto]">
            {current.tab && <input type="hidden" name="tab" value={current.tab} />}
            {focusProblem && <input type="hidden" name="problem" value={focusProblem.id} />}
            {focusCompany && <input type="hidden" name="company" value={focusCompany.id} />}
            <input name="q" defaultValue={q || ''} className="input" placeholder="Search roles or startups" maxLength={80} aria-label="Search roles" />
            <select name="kind" defaultValue={kind || ''} className="input" aria-label="Role type">
              <option value="">Any role type</option>
              {ROLE_KINDS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}{kindCount[k] ? ` (${kindCount[k]})` : ''}
                </option>
              ))}
            </select>
            <select name="country" defaultValue={country || ''} className="input" aria-label="Country">
              <option value="">Anywhere</option>
              {facets.countries.map((c) => (
                <option key={c.country} value={c.country}>
                  {prettyName(c.country)} ({c.n})
                </option>
              ))}
            </select>
            <select name="industry" defaultValue={industry || ''} className="input" aria-label="Area">
              <option value="">Any area</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-ink2">
                <input type="checkbox" name="remote" value="1" defaultChecked={remote} className="h-4 w-4 accent-[#E4572E]" /> Remote
              </label>
              <button className="btn-primary">Filter</button>
            </div>
          </form>
          {filtered && (
            <p className="mt-3 text-sm text-ink2">
              {result.total.toLocaleString('en-IN')} matching role{result.total === 1 ? '' : 's'}.{' '}
              <Link href={href({ tab: current.tab, problem: current.problem, company: current.company }, {})} className="underline hover:text-ink">Clear filters</Link>
            </p>
          )}

          {result.roles.length > 0 ? (
            <>
              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {result.roles.map((r) => <RoleCard key={r.id} role={r} showProblem={!focusProblem} />)}
              </ul>
              {pages > 1 && (
                <div className="mt-6 flex items-center justify-between gap-3">
                  {page > 1 ? (
                    <Link href={href(current, { page: page - 1 > 1 ? page - 1 : null })} className="btn-ghost">← Newer</Link>
                  ) : <span />}
                  <span className="font-mono text-xs text-ink2">Page {page} of {pages}</span>
                  {page < pages ? (
                    <Link href={href(current, { page: page + 1 })} className="btn-ghost">More roles →</Link>
                  ) : <span />}
                </div>
              )}
            </>
          ) : (
            <div className="card mt-5 p-8">
              {importing ? (
                <>
                  <p className="font-display text-2xl font-semibold">Roles are being imported</p>
                  <p className="mt-2 max-w-2xl text-ink2">
                    Atlas is reading the careers pages of the ~{(Math.round(stats.companies / 100) * 100).toLocaleString('en-IN')} startups on
                    the map, best-matched startups first ({stats.checked.toLocaleString('en-IN')} checked so far). New roles appear here
                    over the next day.
                  </p>
                </>
              ) : focusProblem ? (
                <>
                  <p className="font-display text-2xl font-semibold">No open roles on this problem yet</p>
                  <p className="mt-2 text-ink2">
                    None of the startups working on it have a careers page on Atlas yet. Care about it to hear when one does.
                  </p>
                </>
              ) : tab === 'for-you' && !filtered ? (
                <>
                  <p className="font-display text-2xl font-semibold">No open roles on your problems yet</p>
                  <p className="mt-2 text-ink2">
                    The startups working on them haven&apos;t posted roles Atlas can read yet. Add a few more problems above, or{' '}
                    <Link href={href({}, { tab: 'all' })} className="font-semibold text-signal hover:underline">see all roles</Link>.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl font-semibold">Nothing matches that</p>
                  <p className="mt-2 text-ink2">Try fewer filters, or pick more problems you care about.</p>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {curated.length > 0 && !focusProblem && !focusCompany && page === 1 && (
        <section className="mt-12">
          <p className="label">Hand-picked</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Problem-solving roles we found elsewhere</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {curated.map((j) => (
              <RoleCard
                key={`c${j.id}`}
                role={{ ...j, kind: null, remote: false, posted_at: null, problem_id: j.problem_id, votes: 0 }}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-12 flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Hiring people to solve a problem?</h2>
          <p className="mt-1 text-ink2">Add your startup&apos;s careers page. Your open roles show up here and on the problems you work on, free.</p>
        </div>
        <Link href="/hiring" className="btn-primary shrink-0">Add your careers page</Link>
      </section>
    </div>
  );
}
