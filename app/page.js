import Link from 'next/link';
import Atlas from '@/components/Atlas';
import SetupNotice from '@/components/SetupNotice';
import RoleCard from '@/components/RoleCard';
import JobsRefreshPing from '@/components/JobsRefreshPing';
import { getAtlasData, getStats } from '@/lib/queries';
import { jobsStats, listRoles } from '@/lib/roles';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// How Atlas works, in three steps. The menu follows the same order.
const STEPS = [
  ['1', 'You pick a problem', 'Browse the problems people face and tap ♡ on the ones you care about.', '/problems', 'Pick a problem'],
  ['2', 'Atlas finds the startups working on it', 'Every problem is matched to the startups already building a fix, here and worldwide.', '/startups', 'See the startups'],
  ['3', 'Atlas shows those startups’ open jobs', 'Their open roles, straight from their careers pages, each showing the problem you’d be solving.', '/jobs', 'See the jobs'],
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
        ['Problems with roles', jobs.problems_with_roles, '/jobs?tab=problems'],
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

        <ol aria-label="How Atlas works" className="mt-10 grid gap-3 md:grid-cols-3">
          {STEPS.map(([n, t, d, link, cta], i) => (
            <li key={n} className="card relative flex flex-col p-5">
              <p className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-paper">{n}</span>
                <span className="font-display text-xl font-semibold leading-snug">{t}</span>
              </p>
              <p className="mt-3 flex-1 text-sm text-ink2">{d}</p>
              <Link href={link} className="mt-3 text-sm font-semibold text-signal hover:underline">{cta} →</Link>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-ink2 md:flex">→</span>
              )}
            </li>
          ))}
        </ol>

        <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-4">
          {numbers.map(([label, value, link]) => (
            <div key={label} className="bg-paper px-4 py-3">
              <dt className="label">{label}</dt>
              <dd className="mt-1 font-display text-3xl font-semibold">
                {link ? (
                  <Link href={link} className="hover:text-signal">{Number(value || 0).toLocaleString('en-IN')} →</Link>
                ) : (
                  Number(value || 0).toLocaleString('en-IN')
                )}
              </dd>
            </div>
          ))}
        </dl>
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
