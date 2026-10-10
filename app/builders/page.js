import Link from 'next/link';
import SetupNotice from '@/components/SetupNotice';
import { listBuilderBoard } from '@/lib/queries';
import { BUILDER_STAGES, BUILDER_NEEDS, SITE } from '@/lib/constants';
import { prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = {
  title: 'Builders',
  description: 'People building companies around the problems on Atlas. Find a co-founder or join a team.',
};

const label = (list, key) => list.find(([k]) => k === key)?.[1] || key;

export default async function BuildersPage({ searchParams }) {
  const need = BUILDER_NEEDS.some(([k]) => k === searchParams.need) ? searchParams.need : null;
  let builders;
  try {
    builders = await listBuilderBoard({ need });
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }

  return (
    <div className="pt-12">
      <p className="label">Builders board</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">People building on Atlas</h1>
      <p className="mt-3 max-w-2xl text-ink2">
        Each card is someone who claimed a problem and is working on it. Looking for a co-founder or a team to join? Ask
        for an intro on the problem page. Every quarter, {SITE.parent} backs the best-validated claims.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/builders" className={!need ? 'chip-on' : 'chip'}>Everyone</Link>
        {BUILDER_NEEDS.map(([k, l]) => (
          <Link key={k} href={`/builders?need=${k}`} className={need === k ? 'chip-on' : 'chip'}>
            {k === 'cofounder' ? '🤝 ' : ''}Needs {l.toLowerCase()}
          </Link>
        ))}
      </div>

      {builders.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="font-display text-2xl font-semibold">No public claims yet</p>
          <p className="mt-2 text-ink2">Find a validated problem, claim it, and you&apos;ll be the first builder here.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/gaps" className="btn-primary">Find a gap</Link>
            <Link href="/problems?sort=merit" className="btn-ghost">Top problems</Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {builders.map((b) => {
            const needs = (b.needs || '').split(',').filter(Boolean);
            return (
              <li key={b.id} className={`card p-5 ${b.studio_pick ? 'ring-2 ring-signal/50' : ''}`}>
                <p className="font-semibold">
                  {b.first_name}
                  {b.city ? <span className="font-normal text-ink2"> · {b.city}</span> : null}
                  {b.studio_pick && (
                    <span className="ml-2 rounded-full bg-signal px-2 py-0.5 align-middle font-mono text-[9px] uppercase text-white">Studio pick</span>
                  )}
                </p>
                {b.headline && <p className="mt-1">{b.headline}</p>}
                <p className="mt-2 text-sm">
                  Building:{' '}
                  <Link href={`/problems/${b.problem_id}#builders`} className="font-semibold hover:text-signal">{b.problem}</Link>
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink2">
                  {label(BUILDER_STAGES, b.stage)} · {prettyName(b.country)} · ▲ {b.votes} · 🙋 {b.proofs} · {b.updates} update{b.updates === 1 ? '' : 's'}
                </p>
                {needs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {needs.map((n) => (
                      <span key={n} className={n === 'cofounder' ? 'chip-on' : 'chip'}>Needs {label(BUILDER_NEEDS, n).toLowerCase()}</span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
