import { db } from '@/lib/db';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Act on a report from the phone app:
//   hide    → hide the reported item and close every report about it
//   dismiss → keep (or show again) the item and close every report about it
export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const action = body.action === 'hide' ? 'hide' : body.action === 'dismiss' ? 'dismiss' : null;
  if (!action) return jsonError('Unknown action');

  const sql = await db();
  const [report] = await sql`SELECT kind, item_id FROM reports WHERE id = ${id}`;
  if (!report) return jsonError('Report not found', 404);
  const { kind, item_id: item } = report;
  const live = action === 'dismiss';

  if (kind === 'problem') await sql`UPDATE problems SET status = ${live ? 'live' : 'hidden'} WHERE id = ${item}`;
  if (kind === 'comment') await sql`UPDATE problem_comments SET status = ${live ? 'live' : 'hidden'} WHERE id = ${item}`;
  if (kind === 'story') await sql`UPDATE problem_proofs SET status = ${live ? 'live' : 'hidden'} WHERE id = ${item}`;
  // Builder cards: hiding takes the card off the public board; dismissing leaves
  // the card as it is (the builder chose whether it is public).
  if (kind === 'builder' && !live) await sql`UPDATE builder_interests SET is_public = false WHERE id = ${item}`;

  await sql`UPDATE reports SET status = ${live ? 'dismissed' : 'hidden'}
    WHERE kind = ${kind} AND item_id = ${item} AND status = 'new'`;
  return Response.json({ ok: true });
}
