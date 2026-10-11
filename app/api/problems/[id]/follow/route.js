import { db } from '@/lib/db';
import { followProblem } from '@/lib/follow';
import { getUser } from '@/lib/auth';
import { ipHash, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown problem', 404);
  let body = {};
  try {
    body = await request.json();
  } catch {}
  if (body.hp) return Response.json({ ok: true });
  try {
    const sql = await db();
    const [problem] = await sql`SELECT id FROM problems WHERE id = ${id} AND status = 'live'`;
    if (!problem) return jsonError('Unknown problem', 404);
    const user = await getUser().catch(() => null);
    const result = await followProblem(id, body.email || user?.email, ipHash());
    if (result.error) return jsonError(result.error);
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save. Please try again.', 500);
  }
}
