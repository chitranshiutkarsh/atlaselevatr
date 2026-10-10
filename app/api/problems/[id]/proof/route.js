import { db } from '@/lib/db';
import { PROOF_FREQUENCY, PROOF_PAY, PROOF_WHO } from '@/lib/constants';
import { getProofSummary } from '@/lib/queries';
import { getUserId } from '@/lib/auth';
import { ipHash, getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PER_HOUR = 20;

function text(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export async function GET(_request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown problem', 404);
  try {
    return Response.json(await getProofSummary(id));
  } catch (err) {
    console.error(err);
    return jsonError('Could not load', 500);
  }
}

// "This happens to me": a first-hand account. It also counts as a vote.
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

  const story = text(body.story, 500);
  const city = text(body.city, 60) || null;
  const author = text(body.author, 60) || null;
  const frequency = PROOF_FREQUENCY.some(([k]) => k === body.frequency) ? body.frequency : null;
  const pay = PROOF_PAY.some(([k]) => k === body.pay) ? body.pay : null;
  const who = PROOF_WHO.some(([k]) => k === body.who) ? body.who : null;

  if (story.length < 15) return jsonError('Tell us in a sentence what happened to you.');
  if (!frequency) return jsonError('How often does it happen?');
  if (!pay) return jsonError('Would you pay to have it fixed?');
  if (!who) return jsonError('Who does it affect?');

  try {
    const sql = await db();
    const [problem] = await sql`SELECT id FROM problems WHERE id = ${id} AND status = 'live'`;
    if (!problem) return jsonError('Unknown problem', 404);
    const ip = ipHash();
    const visitor = getVisitorId({ create: true });
    const userId = getUserId();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM problem_proofs
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= PER_HOUR) return jsonError('Too many from this network. Try again later.', 429);

    const inserted = await sql`INSERT INTO problem_proofs (problem_id, story, frequency, pay, who, city, author, user_id, visitor_id, ip_hash)
      VALUES (${id}, ${story}, ${frequency}, ${pay}, ${who}, ${city}, ${author}, ${userId}, ${visitor}, ${ip})
      ON CONFLICT (problem_id, visitor_id) DO UPDATE SET story = EXCLUDED.story, frequency = EXCLUDED.frequency,
        pay = EXCLUDED.pay, who = EXCLUDED.who, city = COALESCE(EXCLUDED.city, problem_proofs.city),
        author = COALESCE(EXCLUDED.author, problem_proofs.author), user_id = COALESCE(EXCLUDED.user_id, problem_proofs.user_id)
      RETURNING id`;

    // Saying "this happens to me" is also a vote (once per person).
    const voted = await sql`WITH ins AS (
        INSERT INTO votes (problem_id, visitor_id, ip_hash, user_id) VALUES (${id}, ${visitor}, ${ip}, ${userId})
        ON CONFLICT DO NOTHING RETURNING problem_id
      )
      UPDATE problems SET votes = votes + 1 WHERE id IN (SELECT problem_id FROM ins) RETURNING votes`;
    const [{ votes }] = voted.length ? voted : await sql`SELECT votes FROM problems WHERE id = ${id}`;

    const summary = await getProofSummary(id);
    return Response.json({ ok: true, id: inserted[0]?.id, votes, summary }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save. Please try again.', 500);
  }
}
