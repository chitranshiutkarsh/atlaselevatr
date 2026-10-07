import { db } from '@/lib/db';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENT_OF } from '@/lib/geo';
import { ipHash, getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

function text(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

// Anyone can suggest a startup; it goes live once an admin approves it.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }
  if (body.hp) return Response.json({ ok: true });
  if (!Number(body.t) || Date.now() - Number(body.t) < 2500) return jsonError('Please take a moment before submitting.');

  const name = text(body.name, 100);
  const problem = text(body.problem, 400);
  const sector = text(body.sector, 60) || null;
  const city = text(body.city, 60) || null;
  const submitter = text(body.submitter, 60) || null;
  const contact = text(body.contact, 120) || null;
  let website = text(body.website, 300) || null;
  const founded = parseInt(body.founded, 10);
  const country = body.country;
  const industry = body.industry;

  if (name.length < 2) return jsonError('Add the startup name.');
  if (problem.length < 15) return jsonError('Describe the problem it solves in a sentence.');
  if (!CONTINENT_OF[country]) return jsonError('Pick a country.');
  if (!INDUSTRIES.includes(industry)) return jsonError('Pick a category.');
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website) {
    try {
      new URL(website);
    } catch {
      return jsonError('That website does not look right.');
    }
  }

  try {
    const sql = await db();
    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM company_submissions
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= 5) return jsonError('Too many submissions from this network. Try again later.', 429);

    const [existing] = await sql`SELECT name FROM companies WHERE lower(name) = lower(${name}) LIMIT 1`;
    await sql`INSERT INTO company_submissions
      (name, country, industry, sector, city, problem, website, founded, submitter, contact, visitor_id, ip_hash)
      VALUES (${name}, ${country}, ${industry}, ${sector}, ${city}, ${problem}, ${website},
              ${founded > 1900 && founded <= 2100 ? founded : null}, ${submitter}, ${contact},
              ${getVisitorId({ create: true })}, ${ip})`;
    return Response.json({ ok: true, updatesExisting: Boolean(existing) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save. Please try again.', 500);
  }
}
