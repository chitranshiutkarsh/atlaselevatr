import ProblemForm from '@/components/ProblemForm';
import { CONTINENT_OF } from '@/lib/geo';

export const metadata = { title: 'Add a problem' };

export default function SubmitPage({ searchParams }) {
  const country = CONTINENT_OF[searchParams.country] ? searchParams.country : 'India';
  return (
    <div className="mx-auto max-w-2xl pt-12">
      <p className="label">No login · No sign-up</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Add a problem</h1>
      <p className="mt-3 text-ink2">
        What&apos;s broken where you live or work? Describe it, say how you&apos;d fix it, and let everyone vote.
      </p>
      <ProblemForm defaultCountry={country} />
    </div>
  );
}
