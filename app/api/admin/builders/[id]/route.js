import { db } from '@/lib/db';
import { LEAD_STATUSES } from '@/lib/constants';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const status = LEAD_STATUSES.includes(body.status) ? body.status : null;
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null;
  const sql = await db();
  const rows = await sql`UPDATE builder_interests
    SET status = COALESCE(${status}, status), notes = COALESCE(${notes}, notes)
    WHERE id = ${id} RETURNING id, status, notes`;
  if (!rows.length) return jsonError('Lead not found', 404);
  return Response.json({ lead: rows[0] });
}

export async function DELETE(_request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const sql = await db();
  await sql`DELETE FROM builder_interests WHERE id = ${parseInt(params.id, 10)}`;
  return Response.json({ ok: true });
}
