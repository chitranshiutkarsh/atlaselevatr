import Link from 'next/link';
import PlusButton from '@/components/PlusButton';
import { FREE_MATCHES, PLANS, inr, plusStatus } from '@/lib/plus';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Plans',
  description: `Atlas is free to explore. Atlas+ shows every role matched to the problems you care about, from ${inr(PLANS.month.price)} a month.`,
};

const CONTACT = 'https://www.linkedin.com/in/utkarshchitranshi/';

const FREE = [
  'The world map of problems and startups',
  'Vote on problems and add your own',
  'Every startup in the directory',
  'Browse every open role',
];
const ACCOUNT = [
  'Every role’s apply link',
  `Your top ${FREE_MATCHES} matches for the problems you care about`,
  'Follow problems and get the weekly digest',
  'Claim a problem you want to build',
];
const PLUS = [
  'Every role matched to your problems, not just the top 3',
  'Your intro requests to builders handled first',
  'The monthly “most-wanted problems” report by email',
  'Early access to new Atlas features',
];

function Tick({ children }) {
  return (
    <li className="flex gap-2 text-sm">
      <span aria-hidden="true" className="text-moss">✓</span>
      <span>{children}</span>
    </li>
  );
}

export default async function PlansPage() {
  const status = await plusStatus();
  const until = status.until ? new Date(status.until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="pt-12">
      <p className="label">Plans</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
        Free to explore. <span className="italic text-signal">Atlas+</span> to go further.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink2">
        The map, the problems and the startups stay free. A free account opens every apply link. Atlas+ shows you every role at the
        startups solving the problems you care about.
      </p>
      {status.plus && (
        <p className="mt-5 inline-block rounded-lg bg-moss/10 px-4 py-2 text-sm font-semibold text-moss">
          You have Atlas+{until ? ` until ${until}` : ''}. Thank you for backing Atlas.
        </p>
      )}

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <section className="card flex flex-col p-6">
          <p className="label">Free</p>
          <p className="mt-2 font-display text-4xl font-semibold">₹0</p>
          <p className="text-sm text-ink2">No account needed</p>
          <ul className="mt-5 space-y-2">{FREE.map((f) => <Tick key={f}>{f}</Tick>)}</ul>
          <Link href="/" className="btn-ghost mt-auto justify-center pt-3">Explore the map</Link>
        </section>

        <section className="card flex flex-col p-6">
          <p className="label">Free account</p>
          <p className="mt-2 font-display text-4xl font-semibold">₹0</p>
          <p className="text-sm text-ink2">Sign in with your email</p>
          <ul className="mt-5 space-y-2">
            <li className="text-xs font-semibold uppercase tracking-wide text-ink2">Everything in Free, plus</li>
            {ACCOUNT.map((f) => <Tick key={f}>{f}</Tick>)}
          </ul>
          <div className="mt-auto pt-6">
            {status.signedIn ? (
              <p className="rounded-lg bg-paper2 px-3 py-2 text-center text-sm text-ink2">You&apos;re signed in</p>
            ) : (
              <Link href="/signin?next=/jobs&why=match" className="btn-ghost w-full justify-center">Create a free account</Link>
            )}
          </div>
        </section>

        <section className="relative flex flex-col rounded-2xl bg-ink p-6 text-paper">
          <span className="absolute -top-3 right-5 rounded-full bg-signal px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-white">
            Launch price
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">Atlas+</p>
          <p className="mt-2 font-display text-4xl font-semibold">
            {inr(PLANS.month.price)}
            <span className="text-base font-normal text-paper/70"> a month</span>
          </p>
          <p className="text-sm text-paper/70">or {inr(PLANS.quarter.price)} for 3 months</p>
          <ul className="mt-5 space-y-2">
            <li className="text-xs font-semibold uppercase tracking-wide text-paper/60">Everything in a free account, plus</li>
            {PLUS.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <span aria-hidden="true" className="text-signal">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto space-y-2 pt-6">
            {status.plus ? (
              <p className="rounded-lg bg-paper/10 px-3 py-2 text-center text-sm">Active</p>
            ) : (
              <>
                <PlusButton plan="quarter" signedIn={status.signedIn} label={`${inr(PLANS.quarter.price)} for 3 months · best value`} />
                <PlusButton plan="month" signedIn={status.signedIn} label={`${inr(PLANS.month.price)} a month`} primary={false} />
              </>
            )}
            <p className="text-center text-[11px] text-paper/60">Cancel anytime. Prices in INR.</p>
          </div>
        </section>
      </div>

      <section className="card mt-10 grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="label">For startups, companies and governments</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Put your problem or your startup in front of builders</h2>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <li>
              <span className="font-semibold">Free listing.</span> <span className="text-ink2">Add your startup and careers page; your roles show up on the problems you solve.</span>
            </li>
            <li>
              <span className="font-semibold">Featured startup.</span> <span className="text-ink2">Pinned at the top of your problems and on the map.</span>
            </li>
            <li>
              <span className="font-semibold">Sponsored challenge.</span> <span className="text-ink2">Post a problem with a prize, pilot or grant, and meet the builders who take it on.</span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/hiring" className="btn-primary justify-center">List your startup free</Link>
          <a href={CONTACT} target="_blank" rel="noopener noreferrer" className="btn-ghost justify-center">Talk to us ↗</a>
        </div>
      </section>
    </div>
  );
}
