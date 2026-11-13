import { db } from '@/lib/db';
import { getUser, validEmail } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import { getVisitorId, ipHash, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// "I've paid": someone paid for Atlas+ by UPI and sends their email and the UPI
// reference. It shows in Admin → Atlas+, where you check the payment and activate.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const plan = PLANS[body.plan] ? body.plan : null;
  if (!plan) return jsonError('Pick a plan.');
  if (body.hp) return Response.json({ ok: true }); // bots fill the hidden field

  const user = await getUser().catch(() => null);
  const email = (user?.email || String(body.email || '')).trim().toLowerCase().slice(0, 120);
  if (!validEmail(email)) return jsonError('Add the email you want Atlas+ on.');
  const ref = String(body.ref || '').replace(/\s+/g, '').slice(0, 40);
  if (!/^[A-Za-z0-9]{6,40}$/.test(ref)) return jsonError('Add the UPI reference (UTR) number from your payment app.');

  const sql = await db();
  const ip = ipHash();
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM plus_requests WHERE ip_hash = ${ip} AND created_at > now() - interval '1 day'`;
  if (n >= 5) return jsonError('Too many requests today. Please try again tomorrow.', 429);
  const [dupe] = await sql`SELECT id FROM plus_requests WHERE upi_ref = ${ref} LIMIT 1`;
  if (!dupe) {
    await sql`INSERT INTO plus_requests (user_id, email, plan, upi_ref, amount, ip_hash, visitor_id)
      VALUES (${user?.id || null}, ${email}, ${plan}, ${ref}, ${PLANS[plan].price}, ${ip}, ${getVisitorId()})`;
  }
  return Response.json({ ok: true });
}
