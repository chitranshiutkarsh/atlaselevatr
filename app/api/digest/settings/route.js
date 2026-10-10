import { db } from '@/lib/db';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENT_OF } from '@/lib/geo';
import { getUserId } from '@/lib/auth';
import { saveDigest } from '@/lib/digest';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Signed-in people change or switch off their weekly digest.
export async function POST(request) {
  const userId = getUserId();
  if (!userId) return jsonError('Sign in first.', 401);
  const body = await request.json().catch(() => ({}));
  try {
    if (body.active === false) {
      const sql = await db();
      await sql`UPDATE subscriptions SET active = false WHERE user_id = ${userId}`;
      return Response.json({ ok: true, active: false });
    }
    const country = CONTINENT_OF[body.country] ? body.country : null;
    const industries = Array.isArray(body.industries) ? body.industries.filter((i) => INDUSTRIES.includes(i)).slice(0, 6) : [];
    await saveDigest(userId, { country, industries });
    return Response.json({ ok: true, active: true });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save.', 500);
  }
}
