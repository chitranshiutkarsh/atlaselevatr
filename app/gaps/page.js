import { redirect } from 'next/navigation';

// The gap finder is now a tab on /problems.
export default function GapsPage({ searchParams }) {
  const params = new URLSearchParams({ view: 'gaps' });
  for (const key of ['industry', 'continent', 'country', 'q']) {
    if (typeof searchParams[key] === 'string' && searchParams[key]) params.set(key, searchParams[key]);
  }
  redirect(`/problems?${params}`);
}
