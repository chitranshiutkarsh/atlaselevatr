import Link from 'next/link';
import HiringForm from '@/components/HiringForm';

export const metadata = {
  title: 'Add your careers page',
  description: 'Startups: list your open roles on Atlas, next to the problems you solve. Free.',
};

export default function HiringPage() {
  return (
    <div className="pt-12">
      <p className="label">For startups</p>
      <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
        Hire people who care about the problem you solve.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink2">
        People on Atlas pick the problems they care about. Add your careers page and your open roles show up for them, on
        the jobs page and on every problem your startup works on. It&apos;s free.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <HiringForm />
        <aside className="space-y-4 text-sm">
          <div className="card p-5">
            <p className="label">How it works</p>
            <ol className="mt-3 space-y-3">
              {[
                ['1', 'Paste your careers link', 'Your Greenhouse, Lever, Ashby, SmartRecruiters or Recruitee board.'],
                ['2', 'We read it every day', 'New roles appear on their own; filled ones disappear.'],
                ['3', 'Matched to problems', 'Each role shows the problem your startup is solving, to people who care about it.'],
                ['4', 'Candidates apply with you', 'Apply links go straight to your own job post.'],
              ].map(([n, t, d]) => (
                <li key={n} className="flex gap-3">
                  <span className="font-mono text-xs text-signal">{n}</span>
                  <span><span className="font-semibold">{t}.</span> <span className="text-ink2">{d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-ink2">
            Not on Atlas yet? <Link href="/startups/add" className="font-semibold text-signal hover:underline">List your startup</Link> first.
          </p>
        </aside>
      </div>
    </div>
  );
}
