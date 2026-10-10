import { db } from '@/lib/db';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENT_OF } from '@/lib/geo';
import { emailConfigured, sendMagicLink, validEmail, getUserId } from '@/lib/auth';
import { ipHash, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const PER_HOUR = 6;

// Sends a sign-in link. With `digest` it also signs the person up for the
// weekly digest once they click the link (double opt-in).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }
  if (body.hp) return Response.json({ ok: true });
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!validEmail(email)) return jsonError('Enter a valid email.');

  let digest = null;
  if (body.digest) {
    const country = CONTINENT_OF[body.digest.country] ? body.digest.country : null;
    const industries = Array.isArray(body.digest.industries)
      ? body.digest.industries.filter((i) => INDUSTRIES.includes(i)).slice(0, 6)
      : [];
    digest = { country, industries };
  }

  try {
    const sql = await db();
    // Already signed in with this email: save digest preferences straight away.
    const userId = getUserId();
    if (userId && digest) {
      const [me] = await sql`SELECT email FROM users WHERE id = ${userId}`;
      if (me?.email === email) {
        const { saveDigest } = await import('@/lib/digest');
        await saveDigest(userId, digest);
        return Response.json({ ok: true, saved: true });
      }
    }
    if (!emailConfigured()) {
      return jsonError('Email sign-in is not switched on yet. Please check back soon.', 503);
    }
    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM login_tokens
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= PER_HOUR) return jsonError('Too many sign-in emails from this network. Try again later.', 429);
    await sendMagicLink({ email, nextPath: body.next, digest, ip });
    return Response.json({ ok: true, sent: true });
  } catch (err) {
    console.error(err);
    return jsonError('Could not send the email. Please try again.', 500);
  }
}
