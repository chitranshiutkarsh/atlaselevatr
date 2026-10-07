import Link from 'next/link';
import LiveLeaderboard from '@/components/LiveLeaderboard';
import SetupNotice from '@/components/SetupNotice';
import { listProblems, getStats, MERIT_FORMULA } from '@/lib/queries';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENTS, prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = { title: 'Leaderboard' };

function href(current, change) {
  const next = { ...current, ...change };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
  const qs = params.toString();
  return `/problems${qs ? `?${qs}` : ''}`;
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function ProblemsPage({ searchParams }) {
  const industry = INDUSTRIES.includes(searchParams.industry) ? searchParams.industry : null;
  const continent = CONTINENTS.some((c) => c.name === searchParams.continent) ? searchParams.continent : null;
  const sort = ['new', 'merit', 'discover'].includes(searchParams.sort) ? searchParams.sort : 'top';
  const current = { industry, continent, sort: sort === 'top' ? null : sort };

  let problems;
  let stats;
  try {
    [problems, stats] = await Promise.all([listProblems({ industry, continent, sort, limit: 100 }), getStats()]);
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
  const maxIndustryVotes = Math.max(1, ...stats.industries.map((i) => i.votes));

  return (
    <div className="pt-12">
      <p className="label">Dashboard</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Problem leaderboard</h1>
      <p className="mt-3 max-w-2xl text-ink2">
        Ranked by votes from everyone on Atlas. One vote per person per problem. No sign-up needed.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={href(current, { sort: null })} className={sort === 'top' ? 'chip-on' : 'chip'}>Top voted</Link>
            <Link href={href(current, { sort: 'merit' })} className={sort === 'merit' ? 'chip-on' : 'chip'}>Atlas score</Link>
            <Link href={href(current, { sort: 'discover' })} className={sort === 'discover' ? 'chip-on' : 'chip'}>🎲 Discover</Link>
            <Link href={href(current, { sort: 'new' })} className={sort === 'new' ? 'chip-on' : 'chip'}>Newest</Link>
            <span className="mx-1 h-5 w-px bg-ink/15" />
            <Link href={href(current, { continent: null })} className={!continent ? 'chip-on' : 'chip'}>All regions</Link>
            {CONTINENTS.map((c) => (
              <Link key={c.slug} href={href(current, { continent: c.name })} className={continent === c.name ? 'chip-on' : 'chip'}>
                {c.name}
              </Link>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={href(current, { industry: null })} className={!industry ? 'chip-on' : 'chip'}>All industries</Link>
            {INDUSTRIES.map((i) => (
              <Link key={i} href={href(current, { industry: i })} className={industry === i ? 'chip-on' : 'chip'}>
                {i}
              </Link>
            ))}
          </div>

          {problems.length === 0 ? (
            <div className="card mt-6 p-8 text-center">
              <p className="font-display text-2xl font-semibold">No problems here yet</p>
              <p className="mt-2 text-ink2">Be the first to put one on the map.</p>
              <Link href="/submit" className="btn-primary mt-5">+ Add a problem</Link>
            </div>
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
                ...(sort !== 'top' ? { sort } : {}),
              }).toString()}
            />
          )}
        </section>

        <aside className="space-y-4">
          <div className="card grid grid-cols-2 gap-4 p-5">
            {[
              ['Problems', stats.problems],
              ['Votes', stats.votes],
              ['Countries', stats.countries],
              ['Members', stats.members],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="label">{label}</p>
                <p className="font-display text-3xl font-semibold">{value.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
          <div className="card p-5">
            <p className="label">Where the votes are going</p>
            {stats.industries.length === 0 ? (
              <p className="mt-3 text-sm text-ink2">Votes will show up here.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {stats.industries.map((row) => (
                  <li key={row.industry}>
                    <div className="flex justify-between text-sm">
                      <Link href={href(current, { industry: row.industry })} className="font-medium hover:text-signal">
                        {row.industry}
                      </Link>
                      <span className="font-mono text-xs text-ink2">{row.votes} votes</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-paper2">
                      <div className="h-1.5 rounded-full bg-signal" style={{ width: `${(row.votes / maxIndustryVotes) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link href="/submit" className="btn-primary w-full">+ Add a problem</Link>
        </aside>
      </div>
    </div>
  );
}
