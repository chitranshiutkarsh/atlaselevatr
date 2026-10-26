import { db } from '@/lib/db';
import { syncBoard } from '@/lib/careers';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Admin: approve or reject a startup's careers board (id = company id).
export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const status = ['verified', 'rejected'].includes(body.status) ? body.status : null;
  if (!id || !status) return jsonError('Invalid request');
  const sql = await db();
  const rows = await sql`UPDATE careers_boards SET status = ${status}, updated_at = now(),
      evidence = CASE WHEN ${status} = 'verified' THEN 'approved by admin' ELSE evidence END
    WHERE company_id = ${id} RETURNING company_id, ats, token, status`;
  if (!rows.length) return jsonError('Board not found', 404);
  if (status === 'verified') {
    await syncBoard(rows[0]);
  } else {
    await sql`UPDATE roles SET active = false WHERE company_id = ${id} AND active`;
  }
  return Response.json({ ok: true });
}

export async function DELETE(_request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const sql = await db();
  await sql`UPDATE roles SET active = false WHERE company_id = ${id} AND active`;
  await sql`DELETE FROM careers_boards WHERE company_id = ${id}`;
  await sql`UPDATE companies SET careers_checked = now() WHERE id = ${id}`;
  return Response.json({ ok: true });
}
