import Link from 'next/link';
import RoleCard from './RoleCard';

// Problem page: the ways to work on this problem. Open roles at the startups
// already solving it come first; joining a builder or starting it come after.
export default function WorkOnThis({ problem, work, curated = [], builders = 0 }) {
  const { roles, total, companies, careerLinks } = work;
  const extra = curated.filter((j) => !roles.some((r) => r.url === j.url));

  return (
    <section id="work" className="mt-10 scroll-mt-24">
      <div className="card p-6">
        <p className="label">Work on this problem</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">
          {total > 0
            ? `${total.toLocaleString('en-IN')} open role${total === 1 ? '' : 's'} at ${companies} startup${companies === 1 ? '' : 's'} solving it`
            : 'No open roles found yet'}
        </h2>
        <p className="mt-1 text-sm text-ink2">
          {total > 0
            ? 'Straight from the careers pages of the startups working on this, refreshed daily.'
            : 'None of the startups working on this have a careers page on Atlas yet. Care about it and we’ll show you their roles when they do.'}
        </p>

        {roles.length > 0 && (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {roles.map((r) => <RoleCard key={r.id} role={r} showProblem={false} compact />)}
          </ul>
        )}
        {extra.length > 0 && (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {extra.map((j) => (
              <RoleCard key={`c${j.id}`} role={{ ...j, kind: null, remote: false, posted_at: null }} showProblem={false} compact />
            ))}
          </ul>
        )}
        {careerLinks.length > 0 && (
          <p className="mt-4 text-sm text-ink2">
            Also hiring:{' '}
            {careerLinks.map((c, i) => (
              <span key={c.id}>
                {i > 0 ? ', ' : ''}
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:text-signal">
                  {c.name} ↗
                </a>
              </span>
            ))}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {total > roles.length && (
            <Link href={`/jobs?problem=${problem.id}`} className="btn-primary">See all {total.toLocaleString('en-IN')} roles →</Link>
          )}
          <Link href="/hiring" className="text-sm font-semibold text-signal hover:underline">Hiring for this? Add your careers page</Link>
        </div>

        <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-ink/10 bg-ink/10 text-sm sm:grid-cols-3">
          <li className="bg-paper p-4">
            <p className="font-semibold">Join a startup</p>
            <p className="mt-1 text-ink2">Apply to the roles above at teams already building a fix.</p>
          </li>
          <li className="bg-paper p-4">
            <p className="font-semibold">Join a builder</p>
            <p className="mt-1 text-ink2">
              {builders > 0 ? `${builders} ${builders === 1 ? 'person is' : 'people are'} building this in public.` : 'No one has claimed it in public yet.'}{' '}
              {builders > 0 && <a href="#builders" className="font-semibold text-signal hover:underline">Meet them</a>}
            </p>
          </li>
          <li className="bg-paper p-4">
            <p className="font-semibold">Start it yourself</p>
            <p className="mt-1 text-ink2">
              Claim it and build it. <a href="#build" className="font-semibold text-signal hover:underline">I want to build this</a>
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
