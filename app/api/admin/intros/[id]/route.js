import { db } from '@/lib/db';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'introduced', 'declined'];

// Track intro requests to builders: new → introduced / declined.
export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  if (!STATUSES.includes(body.status)) return jsonError('Unknown status');
  const sql = await db();
  const rows = await sql`UPDATE intro_requests SET status = ${body.status} WHERE id = ${id} RETURNING id, status`;
  if (!rows.length) return jsonError('Request not found', 404);
  return Response.json({ intro: rows[0] });
}
