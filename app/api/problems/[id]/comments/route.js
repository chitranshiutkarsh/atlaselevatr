import { db } from '@/lib/db';
import { listComments } from '@/lib/queries';
import { ipHash, getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const COMMENTS_PER_HOUR = 10;

export async function GET(_request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown problem', 404);
  try {
    return Response.json({ comments: await listComments(id) });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load comments', 500);
  }
}

// Anyone can suggest a solution or leave a comment; no login.
export async function POST(request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown problem', 404);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }
  if (body.hp) return Response.json({ ok: true });
  if (!Number(body.t) || Date.now() - Number(body.t) < 2000) return jsonError('Please take a moment before posting.');

  const text = typeof body.body === 'string' ? body.body.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000) : '';
  const author = typeof body.author === 'string' ? body.author.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
  const kind = body.kind === 'comment' ? 'comment' : 'solution';
  if (text.length < 10) return jsonError('Write at least a sentence.');
  if ((text.match(/https?:\/\//g) || []).length > 2) return jsonError('Please include at most two links.');

  try {
    const sql = await db();
    const [problem] = await sql`SELECT id FROM problems WHERE id = ${id} AND status = 'live'`;
    if (!problem) return jsonError('Unknown problem', 404);
    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM problem_comments
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= COMMENTS_PER_HOUR) return jsonError('You have posted a lot in the last hour. Try again later.', 429);
    const [row] = await sql`INSERT INTO problem_comments (problem_id, kind, body, author, visitor_id, ip_hash)
      VALUES (${id}, ${kind}, ${text}, ${author || null}, ${getVisitorId({ create: true })}, ${ip})
      RETURNING id, kind, body, author, helpful, created_at`;
    return Response.json({ comment: row }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not post your comment', 500);
  }
}
