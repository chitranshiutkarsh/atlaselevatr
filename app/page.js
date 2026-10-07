import Link from 'next/link';
import Atlas from '@/components/Atlas';
import SetupNotice from '@/components/SetupNotice';
import { getAtlasData, getStats } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function Home() {
  let data;
  let stats;
  try {
    [data, stats] = await Promise.all([getAtlasData(), getStats()]);
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }

  return (
    <>
      <section className="pt-12 sm:pt-16">
        <p className="label">The world&apos;s problem atlas</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Every unsolved problem on Earth, <span className="italic text-signal">mapped</span> and ranked.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink2">
          See what unicorns on every continent set out to fix. Add the problems you run into, vote on the ones
          that matter, and find jobs where you get paid to solve them.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/submit" className="btn-primary">+ Add a problem</Link>
          <Link href="/startups" className="btn-ghost">Browse {stats.companies.toLocaleString('en-IN')} startups</Link>
          <Link href="/problems" className="btn-ghost">See the leaderboard</Link>
        </div>

        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-4">
          {[
            ['Startups mapped', stats.companies],
            ['Problems raised', stats.problems],
            ['Votes cast', stats.votes],
            ['Countries', stats.countries],
          ].map(([label, value]) => (
            <div key={label} className="bg-paper px-4 py-3">
              <dt className="label">{label}</dt>
              <dd className="mt-1 font-display text-3xl font-semibold">{value.toLocaleString('en-IN')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Atlas unicorns={data.unicorns} countryCounts={data.countryCounts} />
    </>
  );
}
