import Link from 'next/link';
import { listBuilderBoard } from '@/lib/queries';
import { BUILDER_STAGES, BUILDER_NEEDS } from '@/lib/constants';
import { prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = {
  title: 'My story',
  description:
    'Utkarsh Chitranshi: 1X Founder, 1X CEO. From a farm robot in college to running a wealthtech, through ed-tech, Nykaa, DSCI (NASSCOM) and an MBA with INSEAD. Atlas is his passion project.',
};

const LINKEDIN = 'https://www.linkedin.com/in/utkarshchitranshi/';

const label = (list, key) => list.find(([k]) => k === key)?.[1] || key;

// Latest first: the story starts at the top job and runs back to the start.
const JOURNEY = [
  {
    when: '2026',
    kicker: 'The top job',
    role: 'CEO',
    org: 'Savart',
    note: 'Ran a wealthtech end to end: product, growth, research and the team. Built the product everyday investors use to pick stocks and funds that fit them, and opened new lines of business.',
    hero: true,
  },
  {
    when: '2025',
    kicker: 'Right hand to the CEO',
    role: 'Chief of Staff',
    org: "CEO's Office, DSCI (NASSCOM)",
    note: 'Strategy, planning and new initiatives at India’s cybersecurity industry body, working closely with early-stage startups.',
  },
  {
    when: '2024 – 2025',
    kicker: 'Sharpening the saw',
    role: 'MBA',
    org: 'SPJIMR Mumbai · INSEAD, France',
    note: 'Business analytics and global strategy. Led the product management club.',
  },
  {
    when: '2022 – 2023',
    kicker: 'Building at scale',
    role: 'Product & CTO Office',
    org: 'Nykaa',
    note: 'Owned Cart & Checkout, led payment-security certification, worked with the CTO office and shipped the first version of Nykaa Now.',
  },
  {
    when: '2021',
    kicker: 'Going global',
    role: "Founder's Office",
    org: 'English Quest',
    note: 'Took an ed-tech app into Vietnam and Korea and helped raise the seed round.',
  },
  {
    when: '2019 – 2022',
    kicker: 'Zero to one',
    role: 'First product hire',
    org: 'Lido Learning',
    note: 'Joined a K-12 ed-tech startup in the founder’s office and built its tutor platform from scratch.',
  },
  {
    when: '2017 – 2019',
    kicker: 'Where it started',
    role: 'Co-founder',
    org: 'Care4Plants',
    note: 'Built a LiDAR farm robot in college, won Government of India research funding and filed a patent.',
    founder: true,
  },
  {
    when: '2016 – 2020',
    kicker: 'The foundation',
    role: 'B.Tech, Computer Science',
    org: 'Punjab Technical University',
    note: 'Engineering, and a first research paper, on blockchain in India.',
  },
];

const ARENAS = ['Wealthtech', 'Cybersecurity', 'E-commerce', 'Ed-tech', 'Agri-robotics'];

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
      {/* Intro */}
      <section className="relative overflow-hidden rounded-2xl bg-ink px-6 py-10 text-paper sm:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-signal/25 blur-3xl"
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">Studio · My story</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          1X Founder. <span className="italic text-signal">1X CEO.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-paper/80">
          I’m Utkarsh Chitranshi. I’ve started a company and I’ve run one. Along the way I’ve built products, opened
          markets and sat beside the people making the calls. Atlas is my passion project: a map of the problems worth
          building for.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {ARENAS.map((a) => (
            <span key={a} className="rounded-full border border-paper/25 px-3 py-1 text-xs font-medium text-paper/85">
              {a}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn bg-signal text-white hover:bg-paper hover:text-ink">
            Connect on LinkedIn ↗
          </a>
          <a href="#journey" className="btn border border-paper/30 text-paper hover:border-paper">
            Follow the journey ↓
          </a>
        </div>
      </section>

      {/* Journey: a winding road, latest stop at the top */}
      <section id="journey" className="mt-14 scroll-mt-24">
        <p className="label">The journey</p>
        <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Every stop, from today back to day one</h2>

        <div className="relative mt-10">
          {/* The road */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-4 top-0 w-0.5 bg-gradient-to-b from-signal via-ink/30 to-ink/10 md:left-1/2 md:-translate-x-1/2"
          />
          <p className="relative mb-8 ml-12 font-mono text-[11px] uppercase tracking-[0.16em] text-signal md:ml-0 md:text-center">
            ● You are here
          </p>

          <ol className="space-y-10">
            {JOURNEY.map((j, i) => {
              const right = i % 2 === 1;
              return (
                <li key={`${j.when}-${j.org}`} className="relative md:grid md:grid-cols-2 md:gap-12">
                  {/* Stop marker */}
                  <span
                    aria-hidden="true"
                    className={`absolute left-4 top-5 flex -translate-x-1/2 items-center justify-center rounded-full border-4 border-paper md:left-1/2 ${
                      j.hero ? 'h-6 w-6 bg-signal ring-4 ring-signal/20' : j.founder ? 'h-5 w-5 bg-signal' : 'h-4 w-4 bg-ink'
                    }`}
                  />
                  {/* Year on the other side of the road (desktop) */}
                  <p
                    className={`hidden pt-4 font-mono text-xs uppercase tracking-[0.14em] text-ink2 md:block ${
                      right ? 'md:order-1 md:text-right' : 'md:order-2'
                    }`}
                  >
                    {j.when}
                  </p>
                  <div className={`ml-12 md:ml-0 ${right ? 'md:order-2' : 'md:order-1'}`}>
                    <div
                      className={`rounded-xl p-5 ${
                        j.hero ? 'border-2 border-ink bg-white shadow-sm' : 'border border-ink/10 bg-white/80'
                      } ${right ? '' : 'md:text-right'}`}
                    >
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">
                        {j.kicker}
                        <span className="text-ink2 md:hidden"> · {j.when}</span>
                      </p>
                      <h3 className="mt-1 font-display text-xl font-semibold leading-snug">
                        {j.role}
                        {j.founder && (
                          <span className="ml-2 rounded-full bg-signal px-2 py-0.5 align-middle font-mono text-[9px] uppercase tracking-wide text-white">
                            Founder
                          </span>
                        )}
                        {j.hero && (
                          <span className="ml-2 rounded-full bg-ink px-2 py-0.5 align-middle font-mono text-[9px] uppercase tracking-wide text-paper">
                            CEO
                          </span>
                        )}
                      </h3>
                      <p className="text-sm font-semibold">{j.org}</p>
                      <p className="mt-2 text-sm text-ink2">{j.note}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="relative mt-8 ml-12 font-mono text-[11px] uppercase tracking-[0.16em] text-ink2 md:ml-0 md:text-center">
            ○ Where it all began
          </p>
        </div>
      </section>

      {/* The thread */}
      <section className="mt-16 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-center">
        <p className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
          Find a real problem. <span className="italic text-signal">Then build.</span>
        </p>
        <p className="text-ink2">
          A farm robot in college, a tutor platform from scratch, the checkout of a beauty giant, a company to run. The
          thread is the same every time, and it’s why Atlas exists: so more people can find the problem that’s theirs
          to solve, or join someone already solving it.
        </p>
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
