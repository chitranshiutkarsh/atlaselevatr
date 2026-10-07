import Link from 'next/link';
import { SITE } from '@/lib/constants';

export const metadata = {
  title: 'About us',
  description: `${SITE.parent} is a venture studio that helps founders go from idea to product-market fit, scale, and a Series A.`,
};

const STAGES = [
  {
    step: '01',
    name: 'Ideation',
    body: 'Start from a real, validated problem, not a hunch. We help founders pick problems worth solving, often straight from the problems ranked on Atlas.',
  },
  {
    step: '02',
    name: 'Conceptualisation',
    body: 'Shape the problem into a product: who it’s for, what it does, how it makes money, and the fastest way to test it with real users.',
  },
  {
    step: '03',
    name: 'Product-market fit',
    body: 'Build, launch and iterate until users stay and pay. We bring the playbooks, the team support and the honest feedback loops.',
  },
  {
    step: '04',
    name: 'Scale',
    body: 'Turn what works into a repeatable engine: go-to-market, hiring, operations and the metrics that investors look for.',
  },
  {
    step: '05',
    name: 'Series A',
    body: 'Get investor-ready and raise. We help with the story, the numbers, the data room and introductions to the right investors.',
  },
];

export default function AboutPage() {
  return (
    <div className="pt-12">
      <p className="label">About us</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
        {SITE.parent} builds companies around <span className="italic text-signal">real problems</span>.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-ink2">
        {SITE.parent} is a venture studio. We work alongside founders from the first idea through
        conceptualisation, product-market fit and scale, and help them secure their Series A.
      </p>

      <section className="mt-14">
        <p className="label">How we work with founders</p>
        <ol className="mt-5 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 md:grid-cols-5">
          {STAGES.map((s) => (
            <li key={s.step} className="bg-paper p-5">
              <p className="font-mono text-xs text-signal">{s.step}</p>
              <h2 className="mt-2 font-display text-xl font-semibold">{s.name}</h2>
              <p className="mt-2 text-sm text-ink2">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 grid gap-8 md:grid-cols-2">
        <div>
          <p className="label">Why we built Atlas</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Great companies start with great problems.</h2>
        </div>
        <div className="space-y-4 text-ink2">
          <p>
            Most startup ideas begin with a solution looking for a problem. Atlas flips that: it maps the problems people
            actually face, country by country, and lets everyone vote on the ones that matter most.
          </p>
          <p>
            Next to those problems sit thousands of startups and unicorns, so founders can see what has already been
            solved, where the gaps are, and who is hiring problem-solvers today.
          </p>
          <p>For {SITE.parent}, Atlas is where new ventures begin.</p>
        </div>
      </section>

      <section className="card mt-14 flex flex-col items-start gap-5 p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Building something?</h2>
          <p className="mt-1 text-ink2">List your startup on Atlas, or pick a problem from the leaderboard and start solving it.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/startups/add" className="btn-primary">List your startup</Link>
          <Link href="/problems" className="btn-ghost">Browse problems</Link>
        </div>
      </section>
    </div>
  );
}
