import { db } from '@/lib/db';
import { BUILDER_STAGES, BUILDER_COMMITMENT, BUILDER_NEEDS } from '@/lib/constants';
import { ipHash, getVisitorId, getRefCode, jsonError } from '@/lib/security';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PER_HOUR = 5;

function text(value, max) {
  return typeof value === 'string' ? value.replace(/[ \t]+/g, ' ').trim().slice(0, max) : '';
}

// "Want to build this?": records someone's interest in building a venture
// around a problem. Contact details are visible only to admins.
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
  if (!Number(body.t) || Date.now() - Number(body.t) < 2500) return jsonError('Please take a moment before submitting.');

  const name = text(body.name, 80);
  const email = text(body.email, 120).toLowerCase();
  const phone = text(body.phone, 30) || null;
  const city = text(body.city, 60) || null;
  const pitch = text(body.pitch, 1500) || null;
  const headline = text(body.headline, 140) || null;
  const isPublic = body.is_public === true;
  let linkedin = text(body.linkedin, 200) || null;
  const stage = BUILDER_STAGES.some(([k]) => k === body.stage) ? body.stage : null;
  const commitment = BUILDER_COMMITMENT.some(([k]) => k === body.commitment) ? body.commitment : null;
  const needs = Array.isArray(body.needs)
    ? body.needs.filter((n) => BUILDER_NEEDS.some(([k]) => k === n)).join(',')
    : '';

  if (name.length < 2) return jsonError('Add your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return jsonError('Add a valid email so the team can reach you.');
  if (phone && !/^[+\d][\d\s-]{6,}$/.test(phone)) return jsonError('That phone number does not look right.');
  if (!stage) return jsonError('Tell us where you are with it.');
  if (!commitment) return jsonError('Tell us how much time you can give it.');
  if (linkedin && !/^https?:\/\//i.test(linkedin)) linkedin = `https://${linkedin}`;

  try {
    const sql = await db();
    const [problem] = await sql`SELECT id FROM problems WHERE id = ${id} AND status = 'live'`;
    if (!problem) return jsonError('Unknown problem', 404);
    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM builder_interests
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= PER_HOUR) return jsonError('Too many requests from this network. Try again later.', 429);

    // Re-submitting for the same problem updates the earlier entry.
    const [saved] = await sql`INSERT INTO builder_interests
        (problem_id, name, email, phone, linkedin, city, stage, commitment, needs, pitch, referred_by, visitor_id, ip_hash,
         is_public, headline, user_id)
      VALUES (${id}, ${name}, ${email}, ${phone}, ${linkedin}, ${city}, ${stage}, ${commitment}, ${needs || null},
              ${pitch}, ${getRefCode()}, ${getVisitorId({ create: true })}, ${ip}, ${isPublic}, ${headline}, ${getUserId()})
      ON CONFLICT (problem_id, lower(email)) DO UPDATE SET
        is_public = EXCLUDED.is_public, headline = COALESCE(EXCLUDED.headline, builder_interests.headline),
        visitor_id = EXCLUDED.visitor_id, user_id = COALESCE(EXCLUDED.user_id, builder_interests.user_id),
        name = EXCLUDED.name, phone = COALESCE(EXCLUDED.phone, builder_interests.phone),
        linkedin = COALESCE(EXCLUDED.linkedin, builder_interests.linkedin), city = COALESCE(EXCLUDED.city, builder_interests.city),
        stage = EXCLUDED.stage, commitment = EXCLUDED.commitment, needs = EXCLUDED.needs,
        pitch = COALESCE(EXCLUDED.pitch, builder_interests.pitch)
      RETURNING id`;
    const [{ builders }] = await sql`SELECT count(*)::int AS builders FROM builder_interests WHERE problem_id = ${id}`;
    return Response.json({ ok: true, builders, id: saved.id, is_public: isPublic }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save. Please try again.', 500);
  }
}
