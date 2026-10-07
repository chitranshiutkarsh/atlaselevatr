import { db } from '@/lib/db';
import { listProblems } from '@/lib/queries';
import { INDUSTRIES, LIMITS } from '@/lib/constants';
import { CONTINENT_OF, CONTINENTS } from '@/lib/geo';
import { ipHash, getVisitorId, getRefCode, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const p = request.nextUrl.searchParams;
  const continent = p.get('continent');
  const country = p.get('country');
  const industry = p.get('industry');
  try {
    const rows = await listProblems({
      continent: CONTINENTS.some((c) => c.name === continent) ? continent : null,
      country: country && CONTINENT_OF[country] ? country : null,
      industry: INDUSTRIES.includes(industry) ? industry : null,
      sort: p.get('sort') === 'new' ? 'new' : 'top',
      limit: p.get('limit') || 20,
      offset: p.get('offset') || 0,
    });
    return Response.json({ problems: rows });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load problems', 500);
  }
}

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }

  // Spam traps: a hidden field bots fill in, and a minimum time on the form.
  if (body.website) return Response.json({ ok: true });
  const startedAt = Number(body.t);
  if (!startedAt || Date.now() - startedAt < 2500) return jsonError('Please take a moment before submitting.');

  const title = clean(body.title, LIMITS.titleMax);
  const details = clean(body.details, LIMITS.detailsMax);
  const solution = clean(body.solution, LIMITS.solutionMax);
  const author = clean(body.author, LIMITS.nameMax);
  const industry = body.industry;
  const country = body.country;

  if (title.length < LIMITS.titleMin) return jsonError('Describe the problem in at least a short sentence.');
  if (solution.length < LIMITS.solutionMin) return jsonError('Tell us how you would solve it (a sentence or two).');
  if (!INDUSTRIES.includes(industry)) return jsonError('Pick an industry.');
  if (!CONTINENT_OF[country]) return jsonError('Pick a country.');

  try {
    const sql = await db();
    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM problems
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= LIMITS.submissionsPerHour) {
      return jsonError('You have added several problems in the last hour. Try again later.', 429);
    }
    const [row] = await sql`INSERT INTO problems
      (title, details, industry, solution, country, continent, author, referred_by, visitor_id, ip_hash)
      VALUES (${title}, ${details || null}, ${industry}, ${solution}, ${country}, ${CONTINENT_OF[country]},
              ${author || null}, ${getRefCode()}, ${getVisitorId({ create: true })}, ${ip})
      RETURNING id`;
    return Response.json({ ok: true, id: row.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save your problem. Please try again.', 500);
  }
}
