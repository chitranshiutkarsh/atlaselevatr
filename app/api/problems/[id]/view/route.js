import { db } from '@/lib/db';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Counts a real page view (the browser sends this at most once a day per problem).
export async function POST(_request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown problem', 404);
  try {
    const sql = await db();
    const rows = await sql`UPDATE problems SET views = views + 1 WHERE id = ${id} AND status = 'live' RETURNING views`;
    return Response.json({ views: rows[0]?.views ?? 0 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not record view', 500);
  }
}
