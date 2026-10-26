import Link from 'next/link';
import { listBuilderBoard } from '@/lib/queries';
import { BUILDER_STAGES, BUILDER_NEEDS } from '@/lib/constants';
import { prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = {
  title: 'My story',
  description:
    'Atlas is a passion project of Utkarsh Chitranshi, CEO at Savart. His journey from engineering and ed-tech to Nykaa, DSCI (NASSCOM) and Savart.',
};

const LINKEDIN = 'https://www.linkedin.com/in/utkarshchitranshi/';

const label = (list, key) => list.find(([k]) => k === key)?.[1] || key;

// Oldest first, so the page reads as a story. Keep in step with LinkedIn.
const JOURNEY = [
  {
    when: '2016 – 2020',
    role: 'B.Tech, Computer Science',
    org: 'CGC-COE, Punjab Technical University',
    note: 'Engineering, and a first research paper, on blockchain in India (IEEE).',
  },
  {
    when: '2017 – 2019',
    role: 'Co-founder',
    org: 'Care4Plants',
    note: 'Built a LiDAR and IoT farm robot, won DST (Government of India) research funding and filed a patent.',
  },
  {
    when: '2019 – 2022',
    role: "Founder's Office → Product Manager",
    org: 'Lido Learning',
    note: 'First product hire at a K-12 ed-tech startup; took the tutor platform from 0 to 1.',
  },
  {
    when: '2021',
    role: "Manager, Founder's Office",
    org: 'English Quest',
    note: 'Took an ed-tech app into Vietnam and Korea and supported the seed round.',
  },
  {
    when: '2022 – 2023',
    role: 'Product Manager → Senior Project Manager, CTO Office',
    org: 'Nykaa',
    note: 'Owned Cart & Checkout, led PCI-DSS certification and ran the first version of Nykaa Now.',
  },
  {
    when: '2024 – 2025',
    role: 'MBA (PGDM, Business Analytics)',
    org: 'SPJIMR Mumbai, with an immersion at INSEAD',
    note: 'Headed the product management club and studied global strategy at INSEAD, France.',
  },
  {
    when: '2025',
    role: "Senior Manager, CEO's Office",
    org: 'DSCI (NASSCOM)',
    note: 'Chief of Staff to the CEO, running strategy, planning and special initiatives.',
  },
  {
    when: '2026 – now',
    role: 'CEO',
    org: 'Savart',
    note: 'Leading Savart, a wealthtech helping everyday investors in India build stock and mutual fund portfolios that fit their needs and temperament, backed by research and AI recommendations.',
    now: true,
  },
];

export default async function StudioPage({ searchParams }) {
  const need = BUILDER_NEEDS.some(([k]) => k === searchParams.need) ? searchParams.need : null;

  // The story never depends on the database; the builders board shows only when it loads.
  let builders = null;
  try {
    builders = await listBuilderBoard({ need });
  } catch (err) {
    console.error(err);
  }

  return (
    <div className="pt-12">
      <p className="label">Studio · My story</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
        Atlas is my <span className="italic text-signal">passion project</span>.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-ink2">
        I’m Utkarsh Chitranshi, CEO at Savart. I built Atlas to map the problems people face, show who is already
        solving them, and help people find the gaps worth building, or join a project that’s already underway.
      </p>

      <section className="mt-12 grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-ink font-display text-2xl font-semibold text-paper"
          >
            UC
          </div>
          <p className="mt-4 font-display text-2xl font-semibold leading-tight">Utkarsh Chitranshi</p>
          <p className="mt-1 text-ink2">CEO at Savart</p>
          <p className="mt-3 text-sm text-ink2">Ex-DSCI (NASSCOM), Nykaa, Lido Learning · MBA, SPJIMR</p>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full">
            Connect on LinkedIn ↗
          </a>
        </aside>

        <div>
          <p className="label">My journey</p>
          <h2 className="mt-1 font-display text-3xl font-semibold">The road so far</h2>
          <ol className="mt-6 border-l border-ink/15">
            {JOURNEY.map((j) => (
              <li key={`${j.when}-${j.org}`} className="relative pb-8 pl-6 last:pb-0">
                <span
                  aria-hidden="true"
                  className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${j.now ? 'bg-signal' : 'bg-ink'}`}
                />
                <p className="font-mono text-xs text-signal">{j.when}</p>
                <h3 className="mt-1 font-display text-xl font-semibold leading-snug">{j.role}</h3>
                <p className="text-sm font-medium">{j.org}</p>
                <p className="mt-1 max-w-2xl text-sm text-ink2">{j.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {builders && (
        <section id="builders" className="mt-14 scroll-mt-24">
          <p className="label">Builders board</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">People building on Atlas</h2>
          <p className="mt-2 max-w-2xl text-ink2">
            Each card is someone who claimed a problem publicly. Looking for a co-founder or a team to join? Ask for an
            intro on the problem page.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/studio#builders" className={!need ? 'chip-on' : 'chip'}>Everyone</Link>
            {BUILDER_NEEDS.map(([k, l]) => (
              <Link key={k} href={`/studio?need=${k}#builders`} className={need === k ? 'chip-on' : 'chip'}>
                {k === 'cofounder' ? '🤝 ' : ''}Needs {l.toLowerCase()}
              </Link>
            ))}
          </div>

          {builders.length === 0 ? (
            <div className="card mt-4 p-6">
              <p className="font-semibold">No public claims{need ? ' with this need' : ''} yet.</p>
              <p className="mt-1 text-sm text-ink2">
                Be the first: <Link href="/problems?view=gaps" className="font-semibold text-signal hover:underline">pick a gap</Link> and claim it.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {builders.map((b) => {
                const needs = (b.needs || '').split(',').filter(Boolean);
                return (
                  <li key={b.id} className={`card p-5 ${b.studio_pick ? 'ring-2 ring-signal/50' : ''}`}>
                    <p className="font-semibold">
                      {b.first_name}
                      {b.city ? <span className="font-normal text-ink2"> · {b.city}</span> : null}
                      {b.studio_pick && (
                        <span className="ml-2 rounded-full bg-signal px-2 py-0.5 align-middle font-mono text-[9px] uppercase text-white">In studio</span>
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
        </section>
      )}

      <section className="card mt-14 flex flex-col items-start gap-5 p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Seen a problem worth solving?</h2>
          <p className="mt-1 text-ink2">Add it to Atlas, or say hello on LinkedIn.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/submit" className="btn-primary">+ Add a problem</Link>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn-ghost">LinkedIn ↗</a>
        </div>
      </section>
    </div>
  );
}
