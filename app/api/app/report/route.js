import { db } from '@/lib/db';
import { REPORT_REASONS } from '@/lib/constants';
import { ipHash, getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// How many separate reports hide an item until an admin looks at it.
const AUTO_HIDE = { problem: 5, comment: 3, story: 3, builder: 3 };
const PER_HOUR = 20;

// Report a problem, story, comment or builder card. Reports show in
// /admin → Reports. Enough reports from different people hide the item
// straight away; an admin can show it again.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }
  const kind = Object.keys(AUTO_HIDE).includes(body.kind) ? body.kind : null;
  const itemId = parseInt(body.id, 10);
  const reason = REPORT_REASONS.some(([k]) => k === body.reason) ? body.reason : null;
  const note = typeof body.note === 'string' ? body.note.replace(/\s+/g, ' ').trim().slice(0, 500) || null : null;
  if (!kind || !itemId) return jsonError('Unknown item');
  if (!reason) return jsonError('Pick a reason.');

  try {
    const sql = await db();
    const ip = ipHash();
    const visitor = getVisitorId({ create: true });
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM reports
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= PER_HOUR) return jsonError('Too many reports from this network. Try again later.', 429);

    const found =
      kind === 'problem'
        ? await sql`SELECT id AS problem_id FROM problems WHERE id = ${itemId}`
        : kind === 'comment'
          ? await sql`SELECT problem_id FROM problem_comments WHERE id = ${itemId}`
          : kind === 'story'
            ? await sql`SELECT problem_id FROM problem_proofs WHERE id = ${itemId}`
            : await sql`SELECT problem_id FROM builder_interests WHERE id = ${itemId}`;
    if (!found.length) return jsonError('Unknown item', 404);
    const problemId = found[0].problem_id;

    await sql`INSERT INTO reports (kind, item_id, problem_id, reason, note, visitor_id, ip_hash)
      VALUES (${kind}, ${itemId}, ${problemId}, ${reason}, ${note}, ${visitor}, ${ip})
      ON CONFLICT (kind, item_id, visitor_id) DO UPDATE SET reason = EXCLUDED.reason, note = EXCLUDED.note`;

    const [{ n }] = await sql`SELECT count(DISTINCT ip_hash)::int AS n FROM reports
      WHERE kind = ${kind} AND item_id = ${itemId} AND status = 'new'`;
    if (n >= AUTO_HIDE[kind]) {
      if (kind === 'problem') await sql`UPDATE problems SET status = 'hidden' WHERE id = ${itemId}`;
      if (kind === 'comment') await sql`UPDATE problem_comments SET status = 'hidden' WHERE id = ${itemId}`;
      if (kind === 'story') await sql`UPDATE problem_proofs SET status = 'hidden' WHERE id = ${itemId}`;
      if (kind === 'builder') await sql`UPDATE builder_interests SET is_public = false WHERE id = ${itemId}`;
    }
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not send your report. Please try again.', 500);
  }
}
