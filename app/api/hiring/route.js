import { db } from '@/lib/db';
import { addCareersLink } from '@/lib/careers';
import { ipHash, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function text(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

// A startup adds its careers page. Boards on Greenhouse, Lever, Ashby,
// SmartRecruiters or Recruitee that check out go live at once; anything else
// waits for a quick review.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }
  if (body.hp) return Response.json({ ok: true, status: 'review' });

  const name = text(body.company, 100);
  const url = text(body.url, 500);
  const email = text(body.email, 120) || null;
  if (name.length < 2) return jsonError('Add your startup’s name.');
  if (!/^https?:\/\//i.test(url)) return jsonError('Paste the full link to your careers page, starting with https://');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return jsonError('That email does not look right.');

  try {
    const sql = await db();
    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM careers_boards
      WHERE ip_hash = ${ip} AND updated_at > now() - interval '1 hour'`;
    if (recent >= 5) return jsonError('That’s a lot of links in an hour. Please try again later.', 429);

    const [company] = await sql`SELECT id, name, country, city, problem, is_unicorn FROM companies WHERE lower(name) = lower(${name}) LIMIT 1`;
    if (!company) {
      return Response.json(
        { error: 'not_listed', message: `${name} isn’t on Atlas yet. List it first, then add your careers page.` },
        { status: 404 }
      );
    }
    const [existing] = await sql`SELECT status, source FROM careers_boards WHERE company_id = ${company.id}`;
    if (existing?.source === 'admin' && existing.status === 'verified') {
      return Response.json({ ok: true, status: 'verified', company: company.name, note: 'Already live on Atlas.' });
    }
    const result = await addCareersLink({ company, url, source: 'startup', submitter: email, ip });
    if (result.error) return jsonError(result.error);
    return Response.json({ ok: true, company: company.name, companyId: company.id, ...result });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save that right now', 500);
  }
}
