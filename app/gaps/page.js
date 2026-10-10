import Link from 'next/link';
import GapBadge from '@/components/GapBadge';
import SetupNotice from '@/components/SetupNotice';
import { listGaps, GAP_FORMULA } from '@/lib/queries';
import { refreshCoverage, gapVerdict } from '@/lib/engine';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENTS, CONTINENT_OF, prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = {
  title: 'Gap finder',
  description: 'Problems people want solved where few or no startups are building yet.',
};

function href(current, change) {
  const next = { ...current, ...change };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
  const qs = params.toString();
  return `/gaps${qs ? `?${qs}` : ''}`;
}

export default async function GapsPage({ searchParams }) {
  const industry = INDUSTRIES.includes(searchParams.industry) ? searchParams.industry : null;
  const continent = CONTINENTS.some((c) => c.name === searchParams.continent) ? searchParams.continent : null;
  const country = CONTINENT_OF[searchParams.country] ? searchParams.country : null;
  const current = { industry, continent, country };

  let gaps;
  let pending = 0;
  try {
    // Work out coverage for problems that are new or stale (a few per visit).
    pending = await refreshCoverage({ max: 12 });
    gaps = await listGaps({ industry, continent, country });
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
  const open = gaps.filter((g) => g.local === 0).length;

  return (
    <div className="pt-12">
      <p className="label">Gap finder</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Wanted, but no one&apos;s building it</h1>
      <p className="mt-3 max-w-2xl text-ink2">
        Every problem is matched against the startups on Atlas. These have the most unmet demand: many people face them,
        few startups work on them where they happen. {open > 0 ? `${open} have no startup in their country at all.` : ''}
      </p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink2">Ranked by {GAP_FORMULA}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={href(current, { continent: null, country: null })} className={!continent && !country ? 'chip-on' : 'chip'}>All regions</Link>
        {CONTINENTS.map((c) => (
          <Link key={c.slug} href={href(current, { continent: c.name, country: null })} className={continent === c.name ? 'chip-on' : 'chip'}>
            {c.name}
          </Link>
        ))}
        <Link href={href(current, { country: 'India', continent: null })} className={country === 'India' ? 'chip-on' : 'chip'}>🇮🇳 India</Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link href={href(current, { industry: null })} className={!industry ? 'chip-on' : 'chip'}>All industries</Link>
        {INDUSTRIES.map((i) => (
          <Link key={i} href={href(current, { industry: i })} className={industry === i ? 'chip-on' : 'chip'}>{i}</Link>
        ))}
      </div>

      {pending > 0 && <p className="mt-4 text-xs text-ink2">Matching new problems against the directory… refresh in a moment for more.</p>}

      {gaps.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="font-display text-2xl font-semibold">No gaps here yet</p>
          <p className="mt-2 text-ink2">Add a problem you face and the engine will check who&apos;s solving it.</p>
          <Link href="/submit" className="btn-primary mt-5">+ Add a problem</Link>
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {gaps.map((g, i) => {
            const verdict = gapVerdict({ world: g.world, local: g.local }, prettyName(g.country));
            return (
              <li key={g.id} className="card flex gap-4 p-4">
                <span className="w-8 shrink-0 pt-1 text-right font-mono text-sm text-ink2">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <GapBadge verdict={verdict} small />
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink2">{g.industry} · {prettyName(g.country)}</span>
                  </div>
                  <h2 className="mt-1 text-lg font-semibold leading-snug">
                    <Link href={`/problems/${g.id}`} className="hover:text-signal">{g.title}</Link>
                  </h2>
                  <p className="mt-1 text-sm text-ink2">
                    ▲ {g.votes} votes · 🙋 {g.proofs} face it · 🚀 {g.builders} building · {g.local} startup{g.local === 1 ? '' : 's'} in{' '}
                    {prettyName(g.country)}, {g.world} worldwide
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 text-sm">
                    <Link href={`/problems/${g.id}#build`} className="font-semibold text-signal hover:underline">🚀 Claim this gap →</Link>
                    <Link href={`/problems/${g.id}/startups`} className="font-semibold text-ink hover:text-signal">See who&apos;s solving it elsewhere →</Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
