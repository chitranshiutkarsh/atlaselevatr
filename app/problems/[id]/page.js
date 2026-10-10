import Link from 'next/link';
import { notFound } from 'next/navigation';
import VoteButton from '@/components/VoteButton';
import Comments from '@/components/Comments';
import BuildInterest from '@/components/BuildInterest';
import ViewTracker from '@/components/ViewTracker';
import SetupNotice from '@/components/SetupNotice';
import ProofPanel from '@/components/ProofPanel';
import StartupsSolving from '@/components/StartupsSolving';
import BuildersList from '@/components/BuildersList';
import ShareBar from '@/components/ShareBar';
import DigestSignup from '@/components/DigestSignup';
import { getProblem, listComments, getProofSummary, listPublicBuilders, getInviteForVisitor } from '@/lib/queries';
import { recommendStartups } from '@/lib/engine';
import { getUser } from '@/lib/auth';
import { getVisitorId } from '@/lib/security';
import { prettyName } from '@/lib/geo';
import { SITE, VALIDATION } from '@/lib/constants';

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
  let proof;
  let builders;
  let invite;
  let user;
  let startups = null;
  const visitor = getVisitorId();
  try {
    [problem, comments, proof, builders, invite, user] = await Promise.all([
      getProblem(id),
      listComments(id),
      getProofSummary(id),
      listPublicBuilders(id),
      getInviteForVisitor(visitor),
      getUser().catch(() => null),
    ]);
    if (problem) {
      // The startup engine fills "Who's solving this" for every problem.
      startups = await recommendStartups(problem, { limit: 6 }).catch((err) => {
        console.error('startup engine failed', err);
        return null;
      });
    }
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
  if (!problem) notFound();
  // Dates aren't passed to client components; send ISO strings.
  const plainComments = comments.map((c) => ({ ...c, created_at: new Date(c.created_at).toISOString() }));
  const plainBuilders = builders.map(({ visitor_id, ...b }) => ({
    ...b,
    mine: Boolean(visitor && visitor_id === visitor),
    created_at: new Date(b.created_at).toISOString(),
    updates: (b.updates || []).map((u) => ({ ...u, created_at: new Date(u.created_at).toISOString() })),
  }));
  const validated = proof.total >= VALIDATION.proofs && (problem.builders || 0) >= VALIDATION.builders;

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <ViewTracker id={problem.id} />
      <Link href="/problems" className="label hover:text-ink">← Leaderboard</Link>
      <div className="mt-4 flex gap-4">
        <VoteButton id={problem.id} votes={problem.votes} />
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{problem.title}</h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-ink2">
            {problem.industry} · {prettyName(problem.country)}
            {problem.author ? ` · raised by ${problem.author}` : ''}
            {` · 👁 ${(problem.views || 0).toLocaleString('en-IN')} views`}
          </p>
          {validated && (
            <span className="mt-2 inline-flex rounded-full bg-moss px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-white">
              ✓ Validated problem
            </span>
          )}
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

      <ShareBar
        url={`${SITE.url}/problems/${problem.id}`}
        title={problem.title}
        faced={Math.max(proof.total, problem.votes)}
        refCode={invite?.code || null}
      />

      <ProofPanel problemId={problem.id} initial={proof} builders={problem.builders || 0} />

      {startups && <StartupsSolving problem={problem} result={startups} />}

      <BuildInterest problemId={problem.id} problemTitle={problem.title} initialCount={problem.builders || 0} />

      <BuildersList initial={plainBuilders} />

      <Comments problemId={problem.id} initial={plainComments} />

      <div className="mt-10">
        <DigestSignup defaultCountry={problem.country} defaultIndustry={problem.industry} email={user?.email || ''} />
      </div>
    </div>
  );
}
