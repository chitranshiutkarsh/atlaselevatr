import Link from 'next/link';
import OrgLogo from '@/components/OrgLogo';
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

// Latest first. Kept short on purpose: logo, role, company, years.
const EXPERIENCE = [
  { role: 'CEO', org: 'Savart', domain: 'savart.com', when: '2026', hero: true },
  { role: 'Chief of Staff, CEO’s Office', org: 'DSCI (NASSCOM)', domain: 'dsci.in', when: '2025' },
  { role: 'Product → CTO Office', org: 'Nykaa', domain: 'nykaa.com', when: '2022 – 2023' },
  { role: 'Founder’s Office', org: 'English Quest', domain: 'theenglishquest.com', when: '2021' },
  { role: 'First product hire', org: 'Lido Learning', domain: 'lidolearning.com', when: '2019 – 2022' },
  { role: 'Co-founder', org: 'Care4Plants', domain: null, when: '2017 – 2019' },
];

// Bottom to top: engineering first, then the MBA.
const EDUCATION = [
  { degree: 'MBA', org: 'SPJIMR Mumbai', domain: 'spjimr.org', extra: { org: 'INSEAD, France', domain: 'insead.edu' }, when: '2024 – 2025' },
  { degree: 'B.Tech, Computer Science', org: 'CGC College of Engineering', domain: 'cgc.edu.in', when: '2016 – 2020' },
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

      {/* Journey: experience (bigger) and education side by side */}
      <section id="journey" className="mt-6 grid scroll-mt-24 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-ink/10 bg-white/80 p-4 sm:p-5 lg:col-span-2">
          <p className="label">Experience</p>
          <ol className="relative mt-3">
            <span aria-hidden="true" className="absolute bottom-5 left-5 top-5 w-px bg-ink/15" />
            {EXPERIENCE.map((e) => (
              <li key={e.org} className="relative flex items-center gap-3 py-2">
                <OrgLogo domain={e.domain} name={e.org} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold leading-tight">
                    {e.role}
                    {e.hero && (
                      <span className="ml-2 rounded-full bg-ink px-1.5 py-0.5 align-middle font-mono text-[8px] uppercase text-paper">Latest</span>
                    )}
                  </p>
                  <p className="text-sm text-ink2">{e.org}</p>
                </div>
                <p className="shrink-0 font-mono text-[11px] text-ink2">{e.when}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white/80 p-4 sm:p-5">
          <p className="label">Education</p>
          <div className="mt-3 flex flex-col items-stretch">
            {EDUCATION.map((ed, i) => (
              <div key={ed.degree}>
                {i > 0 && (
                  <p aria-hidden="true" className="py-1 text-center text-xl leading-none text-ink2">↑</p>
                )}
                <div className="rounded-lg border border-ink/10 bg-paper/60 p-3">
                  <div className="flex items-center gap-2">
                    <OrgLogo domain={ed.domain} name={ed.org} size={36} />
                    {ed.extra && <OrgLogo domain={ed.extra.domain} name={ed.extra.org} size={36} />}
                  </div>
                  <p className="mt-2 font-display text-base font-semibold leading-tight">{ed.degree}</p>
                  <p className="text-sm text-ink2">
                    {ed.org}
                    {ed.extra ? ` · ${ed.extra.org}` : ''}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink2">{ed.when}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
