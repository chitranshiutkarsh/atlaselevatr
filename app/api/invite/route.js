import { db } from '@/lib/db';
import { LIMITS } from '@/lib/constants';
import { getInviteForVisitor, topInviters } from '@/lib/queries';
import { ipHash, getVisitorId, getRefCode, newInviteCode, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [mine, leaders] = await Promise.all([
      getInviteForVisitor(getVisitorId()),
      topInviters(10),
    ]);
    return Response.json({ mine, leaders });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load invites', 500);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }
  if (body.website) return Response.json({ ok: true });

  const name = typeof body.name === 'string' ? body.name.replace(/\s+/g, ' ').trim().slice(0, LIMITS.nameMax) : '';
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 120) : '';
  if (name.length < 2) return jsonError('Add your name so people know who invited them.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('That email does not look right.');

  try {
    const sql = await db();
    const visitor = getVisitorId({ create: true });

    const existing = await getInviteForVisitor(visitor);
    if (existing) return Response.json({ invite: existing });

    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM invites
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= LIMITS.invitesPerHour) return jsonError('Too many codes from this network. Try again later.', 429);

    const ref = getRefCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = newInviteCode();
      // referred_by only counts if the referrer exists and is not this visitor.
      const rows = await sql`INSERT INTO invites (code, name, email, visitor_id, referred_by, ip_hash)
        VALUES (${code}, ${name}, ${email || null}, ${visitor},
          (SELECT code FROM invites WHERE code = ${ref} AND visitor_id IS DISTINCT FROM ${visitor}),
          ${ip})
        ON CONFLICT DO NOTHING
        RETURNING code, name, visits`;
      if (rows.length) {
        return Response.json({ invite: { ...rows[0], joined: 0, problems: 0 } }, { status: 201 });
      }
      const again = await getInviteForVisitor(visitor);
      if (again) return Response.json({ invite: again });
    }
    return jsonError('Could not create a code. Please try again.', 500);
  } catch (err) {
    console.error(err);
    return jsonError('Could not create your invite code', 500);
  }
}
