import ProblemForm from '@/components/ProblemForm';
import { CONTINENT_OF } from '@/lib/geo';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add a problem' };

export default async function SubmitPage({ searchParams }) {
  const country = CONTINENT_OF[searchParams.country] ? searchParams.country : 'India';
  const user = await getUser().catch(() => null);
  return (
    <div className="mx-auto max-w-2xl pt-12">
      <p className="label">No login · No sign-up</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Add a problem</h1>
      <p className="mt-3 text-ink2">
        What&apos;s broken where you live or work? Describe it and say how you&apos;d fix it. As you type, we check whether
        someone has raised it already, so your voice adds up instead of splitting.
      </p>
      <ProblemForm defaultCountry={country} email={user?.email || ''} />
    </div>
  );
}
