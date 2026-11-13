import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { PLANS, paymentLink } from '@/lib/plus';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Start Atlas+: record the request, then send the person to the payment link
// for their plan when one is set (ATLAS_PLUS_MONTH_LINK / ATLAS_PLUS_QUARTER_LINK).
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const plan = PLANS[body.plan] ? body.plan : null;
  if (!plan) return jsonError('Pick a plan.');
  const user = await getUser().catch(() => null);
  if (!user) return jsonError('Sign in first.', 401);
  const sql = await db();
  const [recent] = await sql`SELECT id FROM plus_requests
    WHERE user_id = ${user.id} AND plan = ${plan} AND created_at > now() - interval '1 day' LIMIT 1`;
  if (!recent) await sql`INSERT INTO plus_requests (user_id, email, plan) VALUES (${user.id}, ${user.email}, ${plan})`;
  return Response.json({ ok: true, pay: paymentLink(plan) });
}
