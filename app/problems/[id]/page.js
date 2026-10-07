import Link from 'next/link';
import { notFound } from 'next/navigation';
import VoteButton from '@/components/VoteButton';
import Comments from '@/components/Comments';
import BuildInterest from '@/components/BuildInterest';
import SetupNotice from '@/components/SetupNotice';
import { getProblem, listComments } from '@/lib/queries';
import { prettyName } from '@/lib/geo';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function generateMetadata({ params }) {
  const id = parseInt(params.id, 10);
  if (!id) return {};
  try {
    const p = await getProblem(id);
    return p ? { title: p.title, description: p.details || `A problem in ${prettyName(p.country)}. Vote and suggest how to solve it.` } : {};
  } catch {
    return {};
  }
}

export default async function ProblemPage({ params }) {
  const id = parseInt(params.id, 10);
  if (!id) notFound();
  let problem;
  let comments;
  try {
    [problem, comments] = await Promise.all([getProblem(id), listComments(id)]);
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
  if (!problem) notFound();
  // Dates aren't passed to client components; send ISO strings.
  const plainComments = comments.map((c) => ({ ...c, created_at: new Date(c.created_at).toISOString() }));

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <Link href="/problems" className="label hover:text-ink">← Leaderboard</Link>
      <div className="mt-4 flex gap-4">
        <VoteButton id={problem.id} votes={problem.votes} />
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{problem.title}</h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink2">
            {problem.industry} · {prettyName(problem.country)}
            {problem.author ? ` · raised by ${problem.author}` : ''}
          </p>
        </div>
      </div>

      {problem.details && <p className="mt-6 text-lg text-ink2">{problem.details}</p>}

      {problem.source && (
        <p className="mt-4 text-sm text-ink2">
          Source:{' '}
          {problem.source_url ? (
            <a href={problem.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
              {problem.source}
            </a>
          ) : (
            problem.source
          )}
        </p>
      )}

      {problem.solution && (
        <div className="card mt-6 p-5">
          <p className="label">How the person who raised it would solve it</p>
          <p className="mt-2">{problem.solution}</p>
        </div>
      )}

      <BuildInterest problemId={problem.id} problemTitle={problem.title} initialCount={problem.builders || 0} />

      <Comments problemId={problem.id} initial={plainComments} />
    </div>
  );
}
