import { db } from '@/lib/db';
import { PLANS } from '@/lib/plans';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Admin: turn on Atlas+ for a request once payment is in ({ action: 'activate' }),
// or close it ({ action: 'dismiss' }).
export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const sql = await db();
  const [req] = await sql`SELECT id, user_id, email, plan FROM plus_requests WHERE id = ${id}`;
  if (!req) return jsonError('Request not found', 404);
  if (body.action === 'activate') {
    const months = PLANS[req.plan]?.months || 1;
    // Paid without an account: create one for their email, so signing in later finds Atlas+.
    let userId = req.user_id;
    if (!userId) {
      const [u] = await sql`INSERT INTO users (email) VALUES (${req.email})
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`;
      userId = u.id;
      await sql`UPDATE plus_requests SET user_id = ${userId} WHERE id = ${id}`;
    }
    const [u] = await sql`UPDATE users SET plus_until = greatest(coalesce(plus_until, now()), now()) + make_interval(months => ${months})
      WHERE id = ${userId} RETURNING plus_until`;
    // The browser they paid from gets Atlas+ too, even before they sign in.
    await sql`UPDATE plus_requests SET status = 'active', plus_until = ${u.plus_until} WHERE id = ${id}`;
  } else if (body.action === 'dismiss') {
    await sql`UPDATE plus_requests SET status = 'dismissed' WHERE id = ${id}`;
  } else {
    return jsonError('Unknown action');
  }
  return Response.json({ ok: true });
}
