import { db } from '@/lib/db';
import { validEmail } from '@/lib/auth';
import { ipHash, getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

function text(value, max) {
  return typeof value === 'string' ? value.replace(/[ \t]+/g, ' ').trim().slice(0, max) : '';
}

// Ask the studio for an intro to a builder (e.g. to become their co-founder).
// Builders' contact details stay private; the team makes the introduction.
export async function POST(request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown builder', 404);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }
  if (body.hp) return Response.json({ ok: true });
  const name = text(body.name, 80);
  const email = text(body.email, 120).toLowerCase();
  const message = text(body.message, 800) || null;
  if (name.length < 2) return jsonError('Add your name.');
  if (!validEmail(email)) return jsonError('Add a valid email.');

  try {
    const sql = await db();
    const [b] = await sql`SELECT id FROM builder_interests WHERE id = ${id} AND is_public`;
    if (!b) return jsonError('Unknown builder', 404);
    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM intro_requests
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= 5) return jsonError('Too many requests from this network. Try again later.', 429);
    await sql`INSERT INTO intro_requests (builder_id, name, email, message, visitor_id, ip_hash)
      VALUES (${id}, ${name}, ${email}, ${message}, ${getVisitorId({ create: true })}, ${ip})`;
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save. Please try again.', 500);
  }
}
