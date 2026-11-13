import { redirect } from 'next/navigation';
import SignInForm from '@/components/SignInForm';
import Link from 'next/link';
import { emailConfigured, getUserId } from '@/lib/auth';
import { FREE_MATCHES, PLANS, inr } from '@/lib/plus';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

const ERRORS = {
  expired: 'That link has expired or was already used. Ask for a new one.',
  invalid: 'That link is not valid. Ask for a new one.',
  failed: 'Something went wrong signing you in. Please try again.',
};

export default function SignInPage({ searchParams }) {
  const next = typeof searchParams.next === 'string' && /^\/(?!\/)/.test(searchParams.next) ? searchParams.next : '/me';
  if (getUserId()) redirect(next);
  const why = ['apply', 'plus', 'match'].includes(searchParams.why) ? searchParams.why : null;
  const error = ERRORS[searchParams.error];
  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="card p-8">
        <p className="label">No password needed</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {why ? 'Get the most out of Atlas' : 'Sign in to Atlas'}
        </h1>
        {why ? (
          <>
            <p className="mt-2 text-ink2">
              {why === 'apply' && 'Sign in with a free account to open any role and its apply link.'}
              {why === 'match' && 'Sign in with a free account to see the roles matched to the problems you care about.'}
              {why === 'plus' && 'Sign in first, then pick your Atlas+ plan.'}
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>· Every role&apos;s details and apply link</li>
              <li>· Your votes, claims and invite link in one place</li>
              <li>· Your top {FREE_MATCHES} matches, free</li>
            </ul>
            <p className="mt-3 rounded-lg bg-paper2 px-3 py-2 text-xs text-ink2">
              Atlas+ at its launch price: {inr(PLANS.month.price)} a month or {inr(PLANS.quarter.price)} for 3 months.{' '}
              <Link href="/plans" className="font-semibold text-signal hover:underline">See plans</Link>
            </p>
          </>
        ) : (
          <p className="mt-2 text-ink2">
            One email link signs you in and, if you like, signs you up for the weekly digest. Keep your votes, stories, claims and invite
            link in one place. A free account opens every role&apos;s apply link.
          </p>
        )}
        {error && <p className="mt-4 rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal">{error}</p>}
        <div className="mt-6">
          <SignInForm next={next} enabled={emailConfigured()} />
        </div>
      </div>
    </div>
  );
}
