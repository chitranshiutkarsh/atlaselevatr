import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// A builder posts a progress update on their public claim. Only the person who
// made the claim (same browser, or signed in with the same email) can post.
export async function POST(request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown builder', 404);
  const { body: raw } = await request.json().catch(() => ({}));
  const body = typeof raw === 'string' ? raw.replace(/[ \t]+/g, ' ').trim().slice(0, 600) : '';
  if (body.length < 10) return jsonError('Write a sentence or two about your progress.');

  try {
    const sql = await db();
    const visitor = getVisitorId();
    const userId = getUserId();
    const [b] = await sql`SELECT b.id FROM builder_interests b
      LEFT JOIN users u ON u.id = ${userId}
      WHERE b.id = ${id} AND b.is_public
        AND ((${visitor}::text IS NOT NULL AND b.visitor_id = ${visitor})
          OR (b.user_id IS NOT NULL AND b.user_id = ${userId})
          OR (u.email IS NOT NULL AND lower(b.email) = lower(u.email)))`;
    if (!b) return jsonError('Only the builder who made this claim can post updates.', 403);
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM builder_updates
      WHERE builder_id = ${id} AND created_at > now() - interval '1 hour'`;
    if (recent >= 5) return jsonError('That is a lot of updates in an hour. Try again later.', 429);
    const [update] = await sql`INSERT INTO builder_updates (builder_id, body) VALUES (${id}, ${body})
      RETURNING id, body, created_at`;
    return Response.json({ ok: true, update: { ...update, created_at: new Date(update.created_at).toISOString() } }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save. Please try again.', 500);
  }
}
