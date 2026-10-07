import { db } from '@/lib/db';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const status = body.status === 'hidden' ? 'hidden' : 'live';
  const sql = await db();
  const rows = await sql`UPDATE problem_comments SET status = ${status} WHERE id = ${id} RETURNING id, status`;
  if (!rows.length) return jsonError('Comment not found', 404);
  return Response.json({ comment: rows[0] });
}

export async function DELETE(_request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const sql = await db();
  await sql`DELETE FROM problem_comments WHERE id = ${id}`;
  return Response.json({ ok: true });
}
