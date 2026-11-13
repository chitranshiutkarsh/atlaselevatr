import Link from 'next/link';
import { PLANS, inr } from '@/lib/plans';

// Thin launch-price strip above the menu, linking to the plans.
export default function LaunchBanner() {
  return (
    <Link
      href="/plans"
      className="block bg-ink px-4 py-2 text-center text-xs text-paper transition hover:bg-ink/90 sm:text-sm"
    >
      <span className="font-semibold">Launch price</span>
      <span className="mx-2 text-paper/40">·</span>
      Atlas+ {inr(PLANS.month.price)} a month
      <span className="hidden sm:inline">
        <span className="mx-2 text-paper/40">·</span>or {inr(PLANS.quarter.price)} for 3 months
      </span>
      <span className="ml-2 font-semibold underline underline-offset-2">See plans →</span>
    </Link>
  );
}
