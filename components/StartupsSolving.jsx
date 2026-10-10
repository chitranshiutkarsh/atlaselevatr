import Link from 'next/link';
import StartupMatchCard from './StartupMatchCard';
import GapBadge from './GapBadge';
import { gapVerdict } from '@/lib/engine';
import { prettyName } from '@/lib/geo';

// Problem page: who is already working on this, here and around the world.
// Filled automatically by the recommendation engine.
export default function StartupsSolving({ problem, result }) {
  const country = prettyName(problem.country);
  const verdict = gapVerdict(result.totals, country);
  const preview = [...result.local.slice(0, 3), ...result.world.slice(0, 3)];

  return (
    <section id="startups" className="mt-10 scroll-mt-24">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="label">Who&apos;s solving this</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {result.totals.world === 0
                ? 'No one on Atlas is building this yet'
                : `${result.totals.world} startup${result.totals.world === 1 ? '' : 's'} work on this worldwide`}
            </h2>
            <p className="mt-1 text-sm text-ink2">{verdict?.text}</p>
          </div>
          <GapBadge verdict={verdict} />
        </div>

        {preview.length > 0 && (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {preview.map((c) => <StartupMatchCard key={c.id} c={c} />)}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href={`/problems/${problem.id}/startups`} className="btn-primary">
            {result.totals.world > 0 ? `See all ${result.totals.world} startups, by country →` : 'Know a startup solving this? →'}
          </Link>
          <span className="text-xs text-ink2">
            Matched automatically from {country} and around the world. Missing one? Add it and it joins the directory.
          </span>
        </div>
      </div>
    </section>
  );
}
