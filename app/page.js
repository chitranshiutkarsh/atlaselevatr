import Link from 'next/link';
import Atlas from '@/components/Atlas';
import SetupNotice from '@/components/SetupNotice';
import RoleCard from '@/components/RoleCard';
import JobsRefreshPing from '@/components/JobsRefreshPing';
import { getAtlasData, getStats } from '@/lib/queries';
import { jobsStats, listRoles } from '@/lib/roles';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STEPS = [
  ['♡', 'Care', 'Pick the problems you care about.', '/jobs?tab=for-you'],
  ['◎', 'See who’s solving them', 'Every problem is matched to the startups working on it.', '/problems'],
  ['↗', 'Apply', 'Open roles at those startups, with the problem each one solves.', '/jobs?tab=all'],
  ['🚀', 'Or build it', 'No one solving it? Claim it and start it yourself.', '/problems?view=gaps'],
];

export default async function Home() {
  let data;
  let stats;
  let jobs;
  let fresh;
  try {
    [data, stats, jobs, fresh] = await Promise.all([
      getAtlasData(),
      getStats(),
      jobsStats().catch(() => null),
      listRoles({ limit: 4 }).catch(() => ({ roles: [] })),
    ]);
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
  const hasRoles = Boolean(jobs && jobs.roles > 0);
  const numbers = hasRoles
    ? [
        ['Open roles', jobs.roles],
        ['Startups hiring', jobs.hiring],
        ['Problems with roles', jobs.problems_with_roles],
        ['Startups mapped', stats.companies],
      ]
    : [
        ['Startups mapped', stats.companies],
        ['Problems raised', stats.problems],
        ['People facing them', stats.votes],
        ['Countries', stats.countries],
      ];

  return (
    <>
      <JobsRefreshPing />
      <section className="pt-12 sm:pt-16">
        <p className="label">Work on problems that matter to you</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Find work on the problems you <span className="italic text-signal">care about</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink2">
          Atlas maps the problems people face and the {stats.companies.toLocaleString('en-IN')} startups working on them. Pick
          the problems that matter to you, and see the open roles at the companies solving them.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/jobs?tab=for-you" className="btn-primary">♡ Pick problems I care about</Link>
          <Link href="/jobs?tab=all" className="btn-ghost">Browse open roles</Link>
          <Link href="/submit" className="btn-ghost">+ Add a problem</Link>
        </div>

        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-4">
          {numbers.map(([label, value]) => (
            <div key={label} className="bg-paper px-4 py-3">
              <dt className="label">{label}</dt>
              <dd className="mt-1 font-display text-3xl font-semibold">{Number(value || 0).toLocaleString('en-IN')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <p className="label">How Atlas works</p>
        <ol className="mt-3 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([icon, t, d, link]) => (
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

      {fresh.roles.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="label">Hiring now</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Roles on problems people face</h2>
            </div>
            <Link href="/jobs?tab=all" className="text-sm font-semibold text-signal hover:underline">All roles →</Link>
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {fresh.roles.map((r) => <RoleCard key={r.id} role={r} compact />)}
          </ul>
        </section>
      )}

      <Atlas unicorns={data.unicorns} countryCounts={data.countryCounts} />
    </>
  );
}
