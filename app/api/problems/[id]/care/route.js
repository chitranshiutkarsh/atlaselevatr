import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// "I care about this": adds or removes a problem from someone's list. No
// sign-in needed (the visitor cookie); signed-in people keep it across devices.
export async function POST(request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id || id < 1) return jsonError('Unknown problem', 404);
  const body = await request.json().catch(() => ({}));
  const on = body.on !== false;

  try {
    const sql = await db();
    const visitor = getVisitorId({ create: true });
    const userId = getUserId();
    const [problem] = await sql`SELECT id FROM problems WHERE id = ${id} AND status = 'live'`;
    if (!problem) return jsonError('Unknown problem', 404);

    let cares;
    if (on) {
      const rows = await sql`WITH ins AS (
          INSERT INTO cares (problem_id, visitor_id, user_id) VALUES (${id}, ${visitor}, ${userId})
          ON CONFLICT (problem_id, visitor_id) DO UPDATE SET user_id = COALESCE(EXCLUDED.user_id, cares.user_id)
          RETURNING (xmax = 0) AS inserted
        )
        UPDATE problems SET cares = cares + (SELECT count(*)::int FROM ins WHERE inserted)
        WHERE id = ${id} RETURNING cares`;
      cares = rows[0]?.cares;
    } else {
      const rows = await sql`WITH del AS (
          DELETE FROM cares WHERE problem_id = ${id}
            AND (visitor_id = ${visitor} OR (${userId}::int IS NOT NULL AND user_id = ${userId}))
          RETURNING 1
        )
        UPDATE problems SET cares = GREATEST(0, cares - (SELECT count(*)::int FROM del))
        WHERE id = ${id} RETURNING cares`;
      cares = rows[0]?.cares;
    }
    return Response.json({ cared: on, cares: cares ?? 0 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save that', 500);
  }
}
