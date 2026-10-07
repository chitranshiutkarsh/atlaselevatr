import Link from 'next/link';
import { SITE } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper2/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-xl font-semibold">Atlas</p>
          <p className="mt-1 max-w-sm text-sm text-ink2">{SITE.tagline}</p>
          <p className="label mt-4">An {SITE.parent} initiative · {SITE.domain}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink2">
          <Link href="/startups" className="hover:text-ink">Startups</Link>
          <Link href="/problems" className="hover:text-ink">Leaderboard</Link>
          <Link href="/submit" className="hover:text-ink">Add a problem</Link>
          <Link href="/jobs" className="hover:text-ink">Jobs</Link>
          <Link href="/invite" className="hover:text-ink">Invite</Link>
        </div>
      </div>
    </footer>
  );
}
