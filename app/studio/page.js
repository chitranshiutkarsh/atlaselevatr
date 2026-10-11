import Link from 'next/link';
import SetupNotice from '@/components/SetupNotice';
import StageBadge from '@/components/StageBadge';
import { listBuilderBoard, listGaps, getStats } from '@/lib/queries';
import { BUILDER_STAGES, BUILDER_NEEDS, SITE, VALIDATION } from '@/lib/constants';
import { prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = {
  title: 'Studio',
  description: `How a problem on Atlas becomes a company: validate it, check the gap, claim it, and build it with the ${SITE.parent} venture studio.`,
};

const label = (list, key) => list.find(([k]) => k === key)?.[1] || key;

// The Atlas loop, in the order people move through it.
const LOOP = [
  ['01', 'Bring people in', 'Everyone who joins adds problems they face and backs the ones they share.', '/invite', 'Get your invite link'],
  ['02', 'Understand the problems', 'Explore the map and the problem list: who faces what, where, and how often.', '/problems', 'Browse problems'],
  ['03', 'Validate', `People tap “I face this” and add one-line stories. ${VALIDATION.proofs} stories validate a problem.`, '/problems', 'Most faced'],
  ['04', 'Check the gap', 'The startup engine matches every problem against ~9,700 startups to show where no one is building.', '/problems?view=gaps', 'See the gaps'],
  ['05', 'Raise it (or find it)', 'Add a problem in a minute. If someone already raised it, back theirs so the voices add up.', '/submit', 'Add a problem'],
  ['06', 'Claim it', 'Builders claim a problem publicly, post progress and find co-founders.', '/problems?view=gaps', 'Find one to claim'],
  ['07', 'Join the studio', `${SITE.parent} backs the strongest claims from idea to product-market fit, scale and Series A.`, '#apply', 'How we help'],
];

const HELP = [
  ['Validation sprint', 'We test the problem with the people on Atlas who said they face it.'],
  ['Product', 'Shape it into a product: who it is for, what it does, the fastest test.'],
  ['Customers', 'Go-to-market playbooks and the first paying users.'],
  ['Co-founders & team', 'Intros to people on Atlas who want to join you.'],
  ['Funding', 'Investor readiness, the story and the numbers, and the right intros up to Series A.'],
];

export default async function StudioPage({ searchParams }) {
  const need = BUILDER_NEEDS.some(([k]) => k === searchParams.need) ? searchParams.need : null;
  let builders;
  let gaps;
  let stats;
  try {
    [builders, gaps, stats] = await Promise.all([listBuilderBoard({ need }), listGaps({ limit: 4 }), getStats()]);
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }

  return (
    <div className="pt-12">
      <p className="label">{SITE.parent} venture studio</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
        From a problem people face to a <span className="italic text-signal">company</span>.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-ink2">
        Atlas finds the problems worth solving. The studio helps the people who claim them build the company. So far:{' '}
        {stats.validated} validated, {stats.claimed} claimed.
      </p>

      <section className="mt-12">
        <p className="label">How it works</p>
        <ol className="mt-4 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map(([n, t, d, link, cta]) => (
            <li key={n} className="flex flex-col bg-paper p-5">
              <p className="font-mono text-xs text-signal">{n}</p>
              <h2 className="mt-2 font-display text-xl font-semibold">{t}</h2>
              <p className="mt-2 flex-1 text-sm text-ink2">{d}</p>
              <Link href={link} className="mt-3 text-sm font-semibold text-signal hover:underline">{cta} →</Link>
            </li>
          ))}
        </ol>
      </section>

      {gaps.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="label">Ready to claim</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Biggest gaps right now</h2>
            </div>
            <Link href="/problems?view=gaps" className="text-sm font-semibold text-signal hover:underline">All gaps →</Link>
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {gaps.map((g) => (
              <li key={g.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StageBadge problem={g} small />
                  <span className="font-mono text-[11px] uppercase tracking-wide text-ink2">{g.industry} · {prettyName(g.country)}</span>
                </div>
                <Link href={`/problems/${g.id}`} className="mt-1 block font-semibold leading-snug hover:text-signal">{g.title}</Link>
                <p className="mt-1 text-sm text-ink2">
                  ▲ {g.votes} face it · 🙋 {g.proofs} stories · {g.local} startup{g.local === 1 ? '' : 's'} in {prettyName(g.country)}
                </p>
                <Link href={`/problems/${g.id}#build`} className="mt-2 inline-block text-sm font-semibold text-signal hover:underline">🚀 Claim it →</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="apply" className="mt-12 scroll-mt-24 overflow-hidden rounded-xl bg-ink p-6 text-paper sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60">What builders get</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Claim a problem, and we build it with you.</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {HELP.map(([t, d]) => (
            <li key={t}>
              <p className="font-semibold text-[#F4A27F]">{t}</p>
              <p className="mt-1 text-sm text-paper/75">{d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-paper/75">
          To apply, open any problem and tap <span className="font-semibold text-paper">“I want to build this”</span>. Pick
          “Full studio support” under what you need. The team reviews every claim and replies within a week.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/problems?view=gaps" className="btn bg-signal text-white hover:bg-paper hover:text-ink">Find a problem to claim</Link>
          <Link href="/about" className="btn border border-paper/30 text-paper hover:border-paper">About {SITE.parent}</Link>
        </div>
      </section>

      <section id="builders" className="mt-12 scroll-mt-24">
        <p className="label">Builders board</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">People building on Atlas</h2>
        <p className="mt-2 max-w-2xl text-ink2">
          Each card is someone who claimed a problem publicly. Looking for a co-founder or a team to join? Ask for an intro
          on the problem page.
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
            <p className="mt-1 text-sm text-ink2">Be the first: pick a gap above and claim it.</p>
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
    </div>
  );
}
