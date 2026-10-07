import { db } from '@/lib/db';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const sql = await db();
  await sql`DELETE FROM companies WHERE id = ${id}`;
  return Response.json({ ok: true });
}
