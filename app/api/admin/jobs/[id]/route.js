import { db } from '@/lib/db';
import { MAX_ACTIVE_JOBS } from '@/lib/constants';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const active = Boolean(body.active);
  const sql = await db();
  if (active) {
    const [{ count }] = await sql`SELECT count(*)::int AS count FROM jobs WHERE active = true AND id <> ${id}`;
    if (count >= MAX_ACTIVE_JOBS) return jsonError(`Only ${MAX_ACTIVE_JOBS} jobs can be live at once.`, 409);
  }
  const rows = await sql`UPDATE jobs SET active = ${active} WHERE id = ${id} RETURNING *`;
  if (!rows.length) return jsonError('Job not found', 404);
  return Response.json({ job: rows[0] });
}

export async function DELETE(_request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const sql = await db();
  await sql`DELETE FROM jobs WHERE id = ${id}`;
  return Response.json({ ok: true });
}
