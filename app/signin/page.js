import { redirect } from 'next/navigation';
import SignInForm from '@/components/SignInForm';
import { emailConfigured, getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

const ERRORS = {
  expired: 'That link has expired or was already used. Ask for a new one.',
  invalid: 'That link is not valid. Ask for a new one.',
  failed: 'Something went wrong signing you in. Please try again.',
};

export default function SignInPage({ searchParams }) {
  if (getUserId()) redirect('/me');
  const next = typeof searchParams.next === 'string' && searchParams.next.startsWith('/') ? searchParams.next : '/me';
  const error = ERRORS[searchParams.error];
  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="card p-8">
        <p className="label">No password needed</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Sign in to Atlas</h1>
        <p className="mt-2 text-ink2">
          Keep your votes, stories and claims in one place, and get the weekly digest. Everything still works without
          signing in.
        </p>
        {error && <p className="mt-4 rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal">{error}</p>}
        <div className="mt-6">
          <SignInForm next={next} enabled={emailConfigured()} />
        </div>
      </div>
    </div>
  );
}
