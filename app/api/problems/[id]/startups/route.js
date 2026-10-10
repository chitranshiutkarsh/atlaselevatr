import { db } from '@/lib/db';
import { recommendStartups } from '@/lib/engine';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENT_OF } from '@/lib/geo';
import { ipHash, getVisitorId, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function text(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

// Startups working on this problem, from the recommendation engine.
export async function GET(_request, { params }) {
  const id = parseInt(params.id, 10);
  if (!id) return jsonError('Unknown problem', 404);
  try {
    const sql = await db();
    const [problem] = await sql`SELECT id, title, details, industry, country FROM problems WHERE id = ${id} AND status = 'live'`;
    if (!problem) return jsonError('Unknown problem', 404);
    return Response.json(await recommendStartups(problem));
  } catch (err) {
    console.error(err);
    return jsonError('Could not load startups', 500);
  }
}

// "Know a startup solving this?" A startup already in the directory is linked
// straight away. A new one is queued for review; once approved it joins the
// main startup directory and stays linked to this problem.
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
  if (!Number(body.t) || Date.now() - Number(body.t) < 2000) return jsonError('Please take a moment before submitting.');

  const name = text(body.name, 100);
  if (name.length < 2) return jsonError('Add the startup name.');

  try {
    const sql = await db();
    const [problem] = await sql`SELECT id, industry, country FROM problems WHERE id = ${id} AND status = 'live'`;
    if (!problem) return jsonError('Unknown problem', 404);
    const ip = ipHash();
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM company_submissions
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= 10) return jsonError('Too many submissions from this network. Try again later.', 429);

    const [existing] = await sql`SELECT id, name FROM companies WHERE lower(name) = lower(${name}) LIMIT 1`;
    if (existing) {
      await sql`INSERT INTO problem_startups (problem_id, company_id, source) VALUES (${id}, ${existing.id}, 'community')
        ON CONFLICT DO NOTHING`;
      // Keep a record so admins can see who linked what.
      await sql`INSERT INTO company_submissions (name, country, industry, problem, visitor_id, ip_hash, status, problem_id)
        SELECT name, country, industry, problem, ${getVisitorId({ create: true })}, ${ip}, 'linked', ${id}
        FROM companies WHERE id = ${existing.id}`;
      return Response.json({ ok: true, linked: true, name: existing.name }, { status: 201 });
    }

    const pitch = text(body.problem, 400);
    const country = CONTINENT_OF[body.country] ? body.country : problem.country;
    const industry = INDUSTRIES.includes(body.industry) ? body.industry : problem.industry;
    let website = text(body.website, 300) || null;
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    if (website) {
      try {
        new URL(website);
      } catch {
        return jsonError('That website does not look right.');
      }
    }
    if (pitch.length < 15) return jsonError('Say in a sentence what the startup does.');

    await sql`INSERT INTO company_submissions (name, country, industry, problem, website, submitter, visitor_id, ip_hash, problem_id)
      VALUES (${name}, ${country}, ${industry}, ${pitch}, ${website}, ${text(body.submitter, 60) || null},
              ${getVisitorId({ create: true })}, ${ip}, ${id})`;
    return Response.json({ ok: true, queued: true, name }, { status: 201 });
  } catch (err) {
    console.error(err);
    return jsonError('Could not save. Please try again.', 500);
  }
}
