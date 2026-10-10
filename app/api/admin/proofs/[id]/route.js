import { db } from '@/lib/db';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Hide or show a "This happens to me" story.
export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const status = body.status === 'hidden' ? 'hidden' : 'live';
  const sql = await db();
  const rows = await sql`UPDATE problem_proofs SET status = ${status} WHERE id = ${id} RETURNING id, status`;
  if (!rows.length) return jsonError('Story not found', 404);
  return Response.json({ proof: rows[0] });
}
