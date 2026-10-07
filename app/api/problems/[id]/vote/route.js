import { db } from '@/lib/db';
import { LIMITS } from '@/lib/constants';
import { ipHash, getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(_request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id || id < 1) return jsonError('Unknown problem', 404);

  try {
    const sql = await db();
    const visitor = getVisitorId({ create: true });
    const ip = ipHash();

    const [problem] = await sql`SELECT id, votes FROM problems WHERE id = ${id} AND status = 'live'`;
    if (!problem) return jsonError('Unknown problem', 404);

    const [{ fromIp }] = await sql`SELECT count(*)::int AS "fromIp" FROM votes
      WHERE problem_id = ${id} AND ip_hash = ${ip}`;
    if (fromIp >= LIMITS.votesPerIpPerProblem) {
      return Response.json({ votes: problem.votes, voted: true, already: true });
    }

    // Insert the vote and bump the counter in one statement; a repeat vote
    // from the same visitor inserts nothing and leaves the count unchanged.
    const updated = await sql`WITH ins AS (
        INSERT INTO votes (problem_id, visitor_id, ip_hash) VALUES (${id}, ${visitor}, ${ip})
        ON CONFLICT DO NOTHING RETURNING problem_id
      )
      UPDATE problems SET votes = votes + 1
      WHERE id IN (SELECT problem_id FROM ins)
      RETURNING votes`;

    if (updated.length === 0) {
      return Response.json({ votes: problem.votes, voted: true, already: true });
    }
    return Response.json({ votes: updated[0].votes, voted: true, already: false });
  } catch (err) {
    console.error(err);
    return jsonError('Could not record your vote', 500);
  }
}
