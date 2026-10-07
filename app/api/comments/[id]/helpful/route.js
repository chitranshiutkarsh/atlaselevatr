import { db } from '@/lib/db';
import { getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Marks a suggestion as helpful; one mark per visitor.
export async function POST(_request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown comment', 404);
  try {
    const sql = await db();
    const visitor = getVisitorId({ create: true });
    const updated = await sql`WITH ins AS (
        INSERT INTO comment_votes (comment_id, visitor_id)
        SELECT id, ${visitor} FROM problem_comments WHERE id = ${id} AND status = 'live'
        ON CONFLICT DO NOTHING RETURNING comment_id
      )
      UPDATE problem_comments SET helpful = helpful + 1
      WHERE id IN (SELECT comment_id FROM ins)
      RETURNING helpful`;
    if (updated.length) return Response.json({ helpful: updated[0].helpful, already: false });
    const [row] = await sql`SELECT helpful FROM problem_comments WHERE id = ${id}`;
    if (!row) return jsonError('Unknown comment', 404);
    return Response.json({ helpful: row.helpful, already: true });
  } catch (err) {
    console.error(err);
    return jsonError('Could not record that', 500);
  }
}
