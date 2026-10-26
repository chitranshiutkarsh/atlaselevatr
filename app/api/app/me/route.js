import { db } from '@/lib/db';
import { getInviteForVisitor } from '@/lib/queries';
import { problemStage } from '@/lib/constants';
import { getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// "My Atlas" for this phone: the invite code, the problems this person raised
// and the ones they said they face. No sign-in; the device id is the key.
export async function GET() {
  const visitor = getVisitorId();
  if (!visitor) return Response.json({ invite: null, raised: [], faced: [], builds: [] });
  try {
    const sql = await db();
    const [invite, raised, faced, builds] = await Promise.all([
      getInviteForVisitor(visitor),
      sql`SELECT p.id, p.title, p.industry, p.country, p.votes, p.created_at,
          (SELECT count(*)::int FROM problem_proofs pp WHERE pp.problem_id = p.id AND pp.status = 'live') AS proofs,
          (SELECT count(*)::int FROM builder_interests b WHERE b.problem_id = p.id) AS builders,
          EXISTS (SELECT 1 FROM builder_interests b WHERE b.problem_id = p.id AND b.status = 'in studio') AS studio
        FROM problems p WHERE p.visitor_id = ${visitor} AND p.status = 'live'
        ORDER BY p.created_at DESC LIMIT 100`,
      sql`SELECT p.id, p.title, p.industry, p.country, p.votes, v.created_at,
          (SELECT count(*)::int FROM problem_proofs pp WHERE pp.problem_id = p.id AND pp.status = 'live') AS proofs,
          (SELECT count(*)::int FROM builder_interests b WHERE b.problem_id = p.id) AS builders,
          EXISTS (SELECT 1 FROM builder_interests b WHERE b.problem_id = p.id AND b.status = 'in studio') AS studio
        FROM votes v JOIN problems p ON p.id = v.problem_id AND p.status = 'live'
        WHERE v.visitor_id = ${visitor}
        ORDER BY v.created_at DESC LIMIT 200`,
      sql`SELECT b.id, b.problem_id, b.stage, b.status, b.is_public, p.title AS problem
        FROM builder_interests b JOIN problems p ON p.id = b.problem_id AND p.status = 'live'
        WHERE b.visitor_id = ${visitor} ORDER BY b.created_at DESC LIMIT 50`,
    ]);
    const shape = (rows) =>
      rows.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString(), stage: problemStage(r) }));
    return Response.json({ invite, raised: shape(raised), faced: shape(faced), builds });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load your Atlas', 500);
  }
}
