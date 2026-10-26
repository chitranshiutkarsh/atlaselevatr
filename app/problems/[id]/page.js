import Link from 'next/link';
import { notFound } from 'next/navigation';
import Comments from '@/components/Comments';
import BuildInterest from '@/components/BuildInterest';
import ViewTracker from '@/components/ViewTracker';
import SetupNotice from '@/components/SetupNotice';
import FacePanel from '@/components/FacePanel';
import StartupsSolving from '@/components/StartupsSolving';
import BuildersList from '@/components/BuildersList';
import DigestSignup from '@/components/DigestSignup';
import FollowProblem from '@/components/FollowProblem';
import StageBadge from '@/components/StageBadge';
import CareButton from '@/components/CareButton';
import WorkOnThis from '@/components/WorkOnThis';
import { getProblem, listComments, getProofSummary, listPublicBuilders, getInviteForVisitor, jobsForProblem } from '@/lib/queries';
import { recommendStartups } from '@/lib/engine';
import { getUser, getUserId } from '@/lib/auth';
import { caredProblemIds, rolesForProblem } from '@/lib/roles';
import { getDigest } from '@/lib/digest';
import { getVisitorId } from '@/lib/security';
import { prettyName } from '@/lib/geo';
import { SITE } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function generateMetadata({ params }) {
  const id = parseInt(params.id, 10);
  if (!id) return {};
  try {
    const p = await getProblem(id);
    return p ? { title: p.title, description: p.details || `A problem in ${prettyName(p.country)}. Do you face it too?` } : {};
  } catch {
    return {};
  }
}

// The problem page follows the Atlas loop, top to bottom:
// do you face it (validate) → who's solving it (gap check) → build it (claim → studio) → how to solve it.
export default async function ProblemPage({ params, searchParams }) {
  const id = parseInt(params.id, 10);
  if (!id) notFound();

  let problem;
  let comments;
  let proof;
  let builders;
  let invite;
  let user;
  let jobs = [];
  let digest = null;
  let startups = null;
  let work = { roles: [], total: 0, companies: 0, careerLinks: [] };
  let cared = [];
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
      [startups, jobs, digest, cared] = await Promise.all([
        recommendStartups(problem, { limit: 6 }).catch((err) => {
          console.error('startup engine failed', err);
          return null;
        }),
        jobsForProblem(problem, 4).catch(() => []),
        user ? getDigest(user.id).catch(() => null) : null,
        caredProblemIds({ visitorId: visitor, userId: getUserId() }).catch(() => []),
      ]);
      // After the engine has stored this problem's matches, read the roles at those startups.
      work = await rolesForProblem(problem.id, { limit: 6 }).catch((err) => {
        console.error('roles for problem failed', err);
        return work;
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
  const isNew = searchParams?.new === '1';
  const subscribed = Boolean(digest?.active);

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <ViewTracker id={problem.id} />
      <Link href="/problems" className="label hover:text-ink">← All problems</Link>

      {isNew && (
        <div className="card mt-4 border-moss bg-moss/5 p-5">
          <p className="label text-moss">Live now</p>
          <p className="mt-1 font-display text-2xl font-semibold">Your problem is on the map.</p>
          <p className="mt-1 text-sm text-ink2">
            Below: who&apos;s already working on it. Next step: get people who face it to say so. Ten first-hand stories
            validate it for founders.
          </p>
          {searchParams?.following !== '1' && (
            <div className="mt-3">
              <FollowProblem problemId={problem.id} email={user?.email || ''} />
            </div>
          )}
        </div>
      )}

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge problem={problem} />
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink2">
            {problem.industry} · {prettyName(problem.country)}
            {problem.author ? ` · raised by ${problem.author}` : ''}
            {` · 👁 ${(problem.views || 0).toLocaleString('en-IN')} views`}
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{problem.title}</h1>
        <div className="mt-4">
          <CareButton problemId={problem.id} initialCared={cared.includes(problem.id)} initialCount={problem.cares || 0} />
        </div>
        {problem.details && <p className="mt-4 text-lg text-ink2">{problem.details}</p>}
        {problem.source && (
          <p className="mt-3 text-sm text-ink2">
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
      </div>

      {/* 1. Validate: one action, optional story, then share */}
      <FacePanel
        problemId={problem.id}
        votes={problem.votes}
        initial={proof}
        share={{ url: `${SITE.url}/problems/${problem.id}`, title: problem.title, refCode: invite?.code || null }}
      />

      {/* 2. Gap check */}
      {startups && <StartupsSolving problem={problem} result={startups} />}

      {/* 3. Work on it: roles at the startups solving it, join a builder, or start it */}
      <WorkOnThis
        problem={problem}
        work={work}
        curated={jobs.filter((j) => j.problem_id === problem.id)}
        builders={plainBuilders.length}
      />

      {/* 4. Claim → studio, with the builders already on it */}
      <BuildInterest problemId={problem.id} problemTitle={problem.title} initialCount={problem.builders || 0}>
        {plainBuilders.length > 0 ? <BuildersList initial={plainBuilders} embedded /> : null}
      </BuildInterest>

      {/* 5. How to solve it */}
      <Comments
        problemId={problem.id}
        initial={plainComments}
        raiser={problem.solution ? { solution: problem.solution, author: problem.author } : null}
      />

      {!isNew && (
        <div className="card mt-8 p-4">
          <FollowProblem problemId={problem.id} email={user?.email || ''} following={searchParams?.follow === 'on'} />
        </div>
      )}

      {!subscribed && (
        <div className="mt-6">
          <DigestSignup compact defaultCountry={problem.country} defaultIndustry={problem.industry} email={user?.email || ''} />
        </div>
      )}
    </div>
  );
}
