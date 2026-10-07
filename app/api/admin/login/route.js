import { adminConfigured, checkAdminPassword, setAdminSession, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

const attempts = new Map();

export async function POST(request) {
  if (!adminConfigured()) return jsonError('ADMIN_PASSWORD is not set (needs 8+ characters).', 503);
  const ip = (request.headers.get('x-forwarded-for') || 'x').split(',')[0];
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  if (recent.length >= 10) return jsonError('Too many attempts. Wait 15 minutes.', 429);

  let body = {};
  try {
    body = await request.json();
  } catch {}
  if (!checkAdminPassword(body.password)) {
    attempts.set(ip, [...recent, now]);
    return jsonError('Wrong password', 401);
  }
  attempts.delete(ip);
  setAdminSession();
  return Response.json({ ok: true });
}
