import Link from 'next/link';
import Atlas from '@/components/Atlas';
import SetupNotice from '@/components/SetupNotice';
import { getAtlasData, getStats } from '@/lib/queries';
import { SITE, VALIDATION } from '@/lib/constants';

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
          Say which problems you face. The ones enough people share get checked against every startup on Atlas, and the
          gaps no one is building become companies, with builders who claim them and a venture studio behind them.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/problems" className="btn-primary">See problems people face</Link>
          <Link href="/problems?view=gaps" className="btn-ghost">Find a gap to build</Link>
          <Link href="/submit" className="btn-ghost">+ Add a problem</Link>
        </div>

        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-4">
          {[
            ['Startups mapped', stats.companies],
            ['Problems raised', stats.problems],
            ['People facing them', stats.votes],
            ['Countries', stats.countries],
          ].map(([label, value]) => (
            <div key={label} className="bg-paper px-4 py-3">
              <dt className="label">{label}</dt>
              <dd className="mt-1 font-display text-3xl font-semibold">{value.toLocaleString('en-IN')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <p className="label">How Atlas works</p>
        <ol className="mt-3 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['▲', 'Face it', 'Tap “I face this” on problems you have.', '/problems'],
            ['🙋', 'Validate', `${VALIDATION.proofs} one-line stories validate a problem.`, '/problems'],
            ['◎', 'Gap check', 'See who is already solving it, here and worldwide.', '/problems?view=gaps'],
            ['＋', 'Raise it', 'Not on Atlas yet? Add it. We check for duplicates.', '/submit'],
            ['🚀', 'Claim it', 'Builders take on a problem in public.', '/problems?view=gaps'],
            ['★', 'Studio', `${SITE.parent} backs the strongest claims.`, '/studio'],
          ].map(([icon, t, d, link]) => (
            <li key={t} className="bg-paper">
              <Link href={link} className="block h-full p-4 hover:bg-paper2/50">
                <p className="text-lg" aria-hidden="true">{icon}</p>
                <p className="mt-1 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-ink2">{d}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <Atlas unicorns={data.unicorns} countryCounts={data.countryCounts} />
    </>
  );
}
