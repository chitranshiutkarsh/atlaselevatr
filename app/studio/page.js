import Link from 'next/link';
import { listBuilderBoard } from '@/lib/queries';
import { BUILDER_STAGES, BUILDER_NEEDS } from '@/lib/constants';
import { prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = {
  title: 'My story',
  description:
    'Utkarsh Chitranshi: 1X Founder, 1X CEO. Granted patent, Wiley book chapter, IEEE paper. From a farm robot in college to running a wealthtech, through ed-tech, Nykaa, DSCI (NASSCOM) and an MBA with INSEAD. Atlas is his passion project.',
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
    note: 'Ran a wealthtech end to end: product, growth, research and the team, and opened new lines of business.',
    hero: true,
  },
  {
    when: '2025',
    kicker: 'Right hand to the CEO',
    role: 'Chief of Staff',
    org: "CEO's Office, DSCI (NASSCOM)",
    note: 'Strategy, planning and new initiatives at India’s cybersecurity industry body.',
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
    note: 'Owned Cart & Checkout, led payment-security certification and shipped the first Nykaa Now.',
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
    note: 'Built a K-12 ed-tech startup’s tutor platform from scratch.',
  },
  {
    when: '2017 – 2019',
    kicker: 'Where it started',
    role: 'Co-founder',
    org: 'Care4Plants',
    note: 'Built a LiDAR farm robot in college, won Government of India research funding and was granted a patent.',
    founder: true,
  },
  {
    when: '2016 – 2020',
    kicker: 'The foundation',
    role: 'B.Tech, Computer Science',
    org: 'Punjab Technical University',
    note: 'Engineering, an IEEE paper and a Wiley book chapter on blockchain.',
  },
];

// Proof points, from LinkedIn and the papers themselves.
const HIGHLIGHTS = [
  { icon: '👥', title: '10K+ followers', detail: 'on LinkedIn', href: LINKEDIN },
  { icon: '📜', title: 'Patent granted', detail: 'Plant monitoring system · Patent Office, Govt. of India' },
  { icon: '📘', title: 'Book chapter', detail: 'Wiley · Application view towards blockchain: demystifying the myths' },
  { icon: '📄', title: 'Research paper', detail: 'IEEE · Possibilities of blockchain in the Indian market and advertising' },
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
      {/* Intro + journey share one screen */}
      <section className="relative overflow-hidden rounded-2xl bg-ink px-5 py-6 text-paper sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-signal/25 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60">Studio · My story</p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              1X Founder. <span className="italic text-signal">1X CEO.</span>
            </h1>
            <p className="mt-2 text-sm text-paper/80 sm:text-base">
              I’m Utkarsh Chitranshi. I’ve started a company and run one, built products and opened markets. Atlas is
              my passion project: a map of the problems worth building for.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ARENAS.map((a) => (
                <span key={a} className="rounded-full border border-paper/25 px-2.5 py-0.5 text-[11px] text-paper/85">
                  {a}
                </span>
              ))}
            </div>
          </div>
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="btn shrink-0 self-start bg-signal text-white hover:bg-paper hover:text-ink md:self-auto"
          >
            Connect on LinkedIn ↗
          </a>
        </div>
      </section>

      {/* Proof points */}
      <ul className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {HIGHLIGHTS.map((h) => {
          const body = (
            <>
              <span aria-hidden="true" className="text-lg leading-none">{h.icon}</span>
              <span className="min-w-0">
                <span className="block font-display text-sm font-semibold leading-tight">{h.title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-ink2">{h.detail}</span>
              </span>
            </>
          );
          return (
            <li key={h.title}>
              {h.href ? (
                <a href={h.href} target="_blank" rel="noopener noreferrer" className="flex h-full gap-2.5 rounded-lg border border-ink/10 bg-white/80 p-3 transition hover:border-signal">
                  {body}
                </a>
              ) : (
                <div className="flex h-full gap-2.5 rounded-lg border border-ink/10 bg-white/80 p-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Journey: a road of stops, today first. Four across on desktop, a tight line on mobile. */}
      <section id="journey" className="mt-6 scroll-mt-24">
        <div className="flex items-baseline justify-between">
          <p className="label">The journey · today → day one</p>
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-ink2 lg:block">Read left to right</p>
        </div>

        <ol className="relative mt-3 grid gap-x-3 gap-y-3 border-l-2 border-ink/15 pl-5 lg:grid-cols-4 lg:gap-y-6 lg:border-l-0 lg:pl-0">
          {JOURNEY.map((j) => (
            <li key={`${j.when}-${j.org}`} className="relative lg:pt-5">
              {/* road segment + stop (desktop) */}
              <span aria-hidden="true" className="absolute left-0 right-[-0.75rem] top-[9px] hidden h-0.5 bg-ink/15 lg:block" />
              <span
                aria-hidden="true"
                className={`absolute -left-[27px] top-3.5 rounded-full border-2 border-paper lg:left-0 lg:top-1 ${
                  j.hero ? 'h-3.5 w-3.5 bg-signal ring-4 ring-signal/20' : 'h-3 w-3 bg-ink'
                }`}
              />
              <div
                className={`h-full rounded-lg p-3 ${
                  j.hero ? 'border-2 border-ink bg-white' : 'border border-ink/10 bg-white/80'
                }`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink2">{j.when}</p>
                <h3 className="mt-1 font-display text-base font-semibold leading-snug">
                  {j.role}
                  {j.hero && (
                    <span className="ml-1.5 rounded-full bg-ink px-1.5 py-0.5 align-middle font-mono text-[8px] uppercase text-paper">CEO</span>
                  )}
                </h3>
                <p className="text-xs font-semibold">{j.org}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink2">{j.note}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-sm text-ink2">
          <span className="font-semibold text-ink">The thread:</span> find a real problem, then build. That’s why Atlas
          exists, so more people can find the problem that’s theirs to solve, or join someone already solving it.
        </p>
      </section>

      {builders && (
        <section id="builders" className="mt-10 scroll-mt-24">
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

      <section className="card mt-10 flex flex-col items-start gap-5 p-8 md:flex-row md:items-center md:justify-between">
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
