import { db } from '@/lib/db';
import { getProblem, listComments, getProofSummary, listPublicBuilders, jobsForProblem } from '@/lib/queries';
import { recommendStartups, gapVerdict } from '@/lib/engine';
import { problemStage } from '@/lib/constants';
import { prettyName } from '@/lib/geo';
import { getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const iso = (d) => (d ? new Date(d).toISOString() : null);

// Everything the app's problem screen shows, in one call: the problem, the
// stories behind it, who is already solving it, builders, suggestions, jobs,
// and what this device has already done (faced it, shared a story).
export async function GET(_request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id || id < 1) return jsonError('Unknown problem', 404);
  try {
    const visitor = getVisitorId();
    const problem = await getProblem(id);
    if (!problem) return jsonError('Unknown problem', 404);

    const sql = await db();
    const [comments, proof, builders, startups, jobs, mine] = await Promise.all([
      listComments(id),
      getProofSummary(id),
      listPublicBuilders(id),
      recommendStartups(problem, { limit: 6 }).catch((err) => {
        console.error('startup engine failed', err);
        return null;
      }),
      jobsForProblem(problem).catch(() => []),
      visitor
        ? sql`SELECT
              EXISTS (SELECT 1 FROM votes WHERE problem_id = ${id} AND visitor_id = ${visitor}) AS voted,
              EXISTS (SELECT 1 FROM problem_proofs WHERE problem_id = ${id} AND visitor_id = ${visitor}) AS storied,
              coalesce((SELECT json_agg(cv.comment_id) FROM comment_votes cv
                JOIN problem_comments c ON c.id = cv.comment_id
                WHERE c.problem_id = ${id} AND cv.visitor_id = ${visitor}), '[]'::json) AS helped`
        : [{ voted: false, storied: false, helped: [] }],
    ]);

    return Response.json({
      problem: {
        ...problem,
        country_label: prettyName(problem.country),
        created_at: iso(problem.created_at),
        stage: problemStage(problem),
      },
      me: mine[0],
      proof,
      comments: comments.map((c) => ({ ...c, created_at: iso(c.created_at) })),
      builders: builders.map(({ visitor_id, ...b }) => ({
        ...b,
        mine: Boolean(visitor && visitor_id === visitor),
        created_at: iso(b.created_at),
        updates: (b.updates || []).map((u) => ({ ...u, created_at: iso(u.created_at) })),
      })),
      startups: startups && {
        local: startups.local,
        world: startups.world,
        totals: startups.totals,
        verdict: gapVerdict(startups.totals, prettyName(problem.country)),
      },
      jobs,
    });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load this problem', 500);
  }
}
