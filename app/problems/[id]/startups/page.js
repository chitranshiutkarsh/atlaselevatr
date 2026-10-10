import Link from 'next/link';
import { notFound } from 'next/navigation';
import StartupMatchCard from '@/components/StartupMatchCard';
import StartupSuggest from '@/components/StartupSuggest';
import GapBadge from '@/components/GapBadge';
import SetupNotice from '@/components/SetupNotice';
import { getProblem } from '@/lib/queries';
import { recommendStartups, gapVerdict } from '@/lib/engine';
import { prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function generateMetadata({ params }) {
  const id = parseInt(params.id, 10);
  if (!id) return {};
  try {
    const p = await getProblem(id);
    return p ? { title: `Startups solving: ${p.title}` } : {};
  } catch {
    return {};
  }
}

function byCountry(list) {
  const groups = new Map();
  for (const c of list) {
    if (!groups.has(c.country)) groups.set(c.country, []);
    groups.get(c.country).push(c);
  }
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

export default async function ProblemStartupsPage({ params }) {
  const id = parseInt(params.id, 10);
  if (!id) notFound();
  let problem;
  let result;
  try {
    problem = await getProblem(id);
    result = problem ? await recommendStartups(problem, { limit: 120 }) : null;
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
  if (!problem) notFound();
  const country = prettyName(problem.country);
  const verdict = gapVerdict(result.totals, country);
  const world = byCountry(result.world);

  return (
    <div className="mx-auto max-w-5xl pt-10">
      <Link href={`/problems/${problem.id}`} className="label hover:text-ink">← Back to the problem</Link>
      <p className="label mt-6">Startup engine</p>
      <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        Who&apos;s solving “{problem.title}”
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <GapBadge verdict={verdict} />
        <p className="text-ink2">{verdict?.text}</p>
      </div>
      {result.keywords.length > 0 && (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink2">
          Matched on: {result.keywords.slice(0, 10).join(' · ')}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-2xl font-semibold">In {country} ({result.totals.local})</h2>
            {result.local.length === 0 ? (
              <p className="mt-2 text-ink2">
                No startup on Atlas works on this in {country} yet. That could be your opening.{' '}
                <Link href={`/problems/${problem.id}#build`} className="font-semibold text-signal hover:underline">Claim it →</Link>
              </p>
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">{result.local.map((c) => <StartupMatchCard key={c.id} c={c} />)}</ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Around the world ({result.totals.world - result.totals.local})</h2>
            {world.length === 0 ? (
              <p className="mt-2 text-ink2">No matches outside {country} yet.</p>
            ) : (
              world.map(([c, list]) => (
                <div key={c} className="mt-5">
                  <p className="label">{prettyName(c)} · {list.length}</p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">{list.map((s) => <StartupMatchCard key={s.id} c={s} />)}</ul>
                </div>
              ))
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <StartupSuggest problemId={problem.id} defaultIndustry={problem.industry} />
          <div className="card p-5 text-sm text-ink2">
            <p className="label">How matching works</p>
            <p className="mt-2">
              The engine reads the problem and searches every startup on Atlas for the same need: by what it does, its
              sector and its category. Same-country and same-industry startups rank higher. Startups people add here are
              checked by the team, then join the main directory.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
