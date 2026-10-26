import Link from 'next/link';
import LiveLeaderboard from '@/components/LiveLeaderboard';
import GapList from '@/components/GapList';
import SetupNotice from '@/components/SetupNotice';
import { listProblems, listGaps, getStats, MERIT_FORMULA, GAP_FORMULA } from '@/lib/queries';
import { refreshCoverage } from '@/lib/engine';
import { INDUSTRIES, VALIDATION } from '@/lib/constants';
import { CONTINENTS, CONTINENT_OF, COUNTRIES, prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = {
  title: 'Problems',
  description: 'Every problem on Atlas: the ones most people face, the gaps no startup is building, and the newest.',
};

const TABS = [
  ['top', 'Most faced'],
  ['gaps', 'Gaps: no one building'],
  ['new', 'Newest'],
  ['discover', '🎲 Discover'],
];

function href(current, change) {
  const next = { ...current, ...change };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
  const qs = params.toString();
  return `/problems${qs ? `?${qs}` : ''}`;
}

// One place for every problem. Tabs replace the separate leaderboard and gap
// finder: same filters, different ordering.
export default async function ProblemsPage({ searchParams }) {
  const industry = INDUSTRIES.includes(searchParams.industry) ? searchParams.industry : null;
  const country = CONTINENT_OF[searchParams.country] ? searchParams.country : null;
  const continent = !country && CONTINENTS.some((c) => c.name === searchParams.continent) ? searchParams.continent : null;
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim().slice(0, 80) || null : null;
  const view = searchParams.view === 'gaps' ? 'gaps' : null;
  const sort = view ? 'gaps' : ['new', 'merit', 'discover'].includes(searchParams.sort) ? searchParams.sort : 'top';
  const current = { view, sort: ['new', 'merit', 'discover'].includes(sort) ? sort : null, industry, continent, country, q };

  let problems = [];
  let gaps = [];
  let pending = 0;
  let stats;
  try {
    if (view === 'gaps') {
      pending = await refreshCoverage({ max: 12 });
      [gaps, stats] = await Promise.all([listGaps({ industry, continent, country, q }), getStats()]);
    } else {
      [problems, stats] = await Promise.all([listProblems({ industry, continent, country, q, sort, limit: 100 }), getStats()]);
    }
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }

  const maxIndustryVotes = Math.max(1, ...stats.industries.map((i) => i.votes));
  const tabHref = (key) =>
    key === 'gaps' ? href(current, { view: 'gaps', sort: null }) : href(current, { view: null, sort: key === 'top' ? null : key });
  const where = country ? prettyName(country) : continent;
  const empty = view === 'gaps' ? gaps.length === 0 : problems.length === 0;

  return (
    <div className="pt-12">
      <p className="label">Problems</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {view === 'gaps' ? "Wanted, but no one's building it" : 'Problems people face'}
        {where ? <span className="text-ink2"> in {where}</span> : null}
      </h1>
      <p className="mt-3 max-w-2xl text-ink2">
        {view === 'gaps'
          ? 'Problems with the most unmet demand: many people face them, few startups work on them where they happen.'
          : `Tap ▲ if you face a problem. Add a one-line story to make it evidence: ${VALIDATION.proofs} stories validate a problem for founders. ${stats.validated} validated so far, ${stats.claimed} claimed by builders.`}
      </p>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-ink/10">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={tabHref(key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${
              sort === key ? 'border-signal text-ink' : 'border-transparent text-ink2 hover:text-ink'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section>
          <form action="/problems" method="get" className="flex flex-col gap-2 sm:flex-row">
            {view && <input type="hidden" name="view" value={view} />}
            {current.sort && <input type="hidden" name="sort" value={current.sort} />}
            {industry && <input type="hidden" name="industry" value={industry} />}
            <input
              name="q"
              defaultValue={q || ''}
              className="input sm:flex-1"
              placeholder="Search problems, e.g. clinics, traffic, rent"
              maxLength={80}
              aria-label="Search problems"
            />
            <select name="country" defaultValue={country || ''} className="input sm:w-48" aria-label="Country">
              <option value="">All countries</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{prettyName(c)}</option>)}
            </select>
            <button className="btn-primary">Search</button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={href(current, { continent: null, country: null })} className={!continent && !country ? 'chip-on' : 'chip'}>All regions</Link>
            {CONTINENTS.map((c) => (
              <Link key={c.slug} href={href(current, { continent: c.name, country: null })} className={continent === c.name ? 'chip-on' : 'chip'}>
                {c.name}
              </Link>
            ))}
            {country && <span className="chip-on">{prettyName(country)}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={href(current, { industry: null })} className={!industry ? 'chip-on' : 'chip'}>All industries</Link>
            {INDUSTRIES.map((i) => (
              <Link key={i} href={href(current, { industry: i })} className={industry === i ? 'chip-on' : 'chip'}>
                {i}
              </Link>
            ))}
          </div>

          {q && (
            <p className="mt-4 text-sm text-ink2">
              Results for “{q}”. <Link href={href(current, { q: null })} className="underline hover:text-ink">Clear search</Link>
            </p>
          )}

          {empty ? (
            <div className="card mt-6 p-8 text-center">
              <p className="font-display text-2xl font-semibold">{q ? 'Nothing matches that yet' : 'No problems here yet'}</p>
              <p className="mt-2 text-ink2">
                {view === 'gaps' ? 'Add a problem you face and the engine will check who’s solving it.' : 'Be the first to put one on the map.'}
              </p>
              <Link href={`/submit${country ? `?country=${encodeURIComponent(country)}` : ''}`} className="btn-primary mt-5">+ Add a problem</Link>
            </div>
          ) : view === 'gaps' ? (
            <>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-ink2">Ranked by {GAP_FORMULA}</p>
              {pending > 0 && <p className="mt-1 text-xs text-ink2">Matching new problems against the directory… refresh in a moment for more.</p>}
              <GapList gaps={gaps} />
            </>
          ) : (
            <LiveLeaderboard
              key={problems.map((p) => p.id).join(',')}
              initial={problems.map((p) => ({ ...p, created_at: new Date(p.created_at).toISOString() }))}
              sort={sort}
              formula={MERIT_FORMULA}
              query={new URLSearchParams({
                limit: '100',
                ...(industry ? { industry } : {}),
                ...(continent ? { continent } : {}),
                ...(country ? { country } : {}),
                ...(q ? { q } : {}),
                ...(sort !== 'top' ? { sort } : {}),
              }).toString()}
            />
          )}
        </section>

        <aside className="space-y-4">
          <Link href="/submit" className="btn-primary w-full">+ Add a problem</Link>
          <div className="card p-5 text-sm">
            <p className="label">How Atlas works</p>
            <ol className="mt-3 space-y-2">
              {[
                ['1', 'You pick a problem', 'Open one and tap ♡ I care about this.'],
                ['2', 'Atlas finds the startups working on it', 'Listed on every problem page.'],
                ['3', 'Atlas shows their open jobs', 'Each role shows the problem you’d solve.'],
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-2">
                  <span className="w-5 shrink-0 text-center font-mono text-signal">{n}</span>
                  <span><span className="font-semibold">{t}.</span> <span className="text-ink2">{d}</span></span>
                </li>
              ))}
            </ol>
            <Link href="/jobs?tab=problems" className="mt-3 inline-block font-semibold text-signal hover:underline">See jobs by problem →</Link>
          </div>
          <div className="card p-5">
            <p className="label">Where people face problems</p>
            {stats.industries.length === 0 ? (
              <p className="mt-3 text-sm text-ink2">This fills up as people say they face problems.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {stats.industries.map((row) => (
                  <li key={row.industry}>
                    <div className="flex justify-between text-sm">
                      <Link href={href(current, { industry: row.industry })} className="font-medium hover:text-signal">
                        {row.industry}
                      </Link>
                      <span className="font-mono text-xs text-ink2">{row.votes} face it</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-paper2">
                      <div className="h-1.5 rounded-full bg-signal" style={{ width: `${(row.votes / maxIndustryVotes) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
