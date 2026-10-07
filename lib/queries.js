import { db } from './db';

export async function getAtlasData() {
  const sql = await db();
  const [companies, counts] = await Promise.all([
    sql`SELECT id, name, country, continent, industry, problem, website
        FROM companies ORDER BY name`,
    sql`SELECT country, count(*)::int AS problems, coalesce(sum(votes), 0)::int AS votes
        FROM problems WHERE status = 'live' GROUP BY country`,
  ]);
  const countryCounts = {};
  for (const row of counts) countryCounts[row.country] = { problems: row.problems, votes: row.votes };
  return { companies, countryCounts };
}

export async function listProblems({ continent = null, country = null, industry = null, sort = 'top', limit = 50, offset = 0 } = {}) {
  const sql = await db();
  const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const off = Math.max(parseInt(offset, 10) || 0, 0);
  if (sort === 'new') {
    return sql`SELECT id, title, details, industry, solution, country, continent, author, votes, created_at
      FROM problems
      WHERE status = 'live'
        AND (${continent}::text IS NULL OR continent = ${continent})
        AND (${country}::text IS NULL OR country = ${country})
        AND (${industry}::text IS NULL OR industry = ${industry})
      ORDER BY created_at DESC
      LIMIT ${lim} OFFSET ${off}`;
  }
  return sql`SELECT id, title, details, industry, solution, country, continent, author, votes, created_at
    FROM problems
    WHERE status = 'live'
      AND (${continent}::text IS NULL OR continent = ${continent})
      AND (${country}::text IS NULL OR country = ${country})
      AND (${industry}::text IS NULL OR industry = ${industry})
    ORDER BY votes DESC, created_at DESC
    LIMIT ${lim} OFFSET ${off}`;
}

export async function getStats() {
  const sql = await db();
  const [totals] = await sql`SELECT
      (SELECT count(*)::int FROM problems WHERE status = 'live') AS problems,
      (SELECT coalesce(sum(votes), 0)::int FROM problems WHERE status = 'live') AS votes,
      (SELECT count(DISTINCT country)::int FROM problems WHERE status = 'live') AS countries,
      (SELECT count(*)::int FROM companies) AS companies,
      (SELECT count(*)::int FROM invites) AS members`;
  const industries = await sql`SELECT industry, count(*)::int AS problems, coalesce(sum(votes), 0)::int AS votes
    FROM problems WHERE status = 'live'
    GROUP BY industry ORDER BY votes DESC, problems DESC LIMIT 8`;
  return { ...totals, industries };
}

export async function listJobs({ includeInactive = false } = {}) {
  const sql = await db();
  if (includeInactive) {
    return sql`SELECT * FROM jobs ORDER BY active DESC, created_at DESC`;
  }
  return sql`SELECT id, title, company, location, source, url, focus, created_at
    FROM jobs WHERE active = true ORDER BY created_at DESC LIMIT 50`;
}

export async function topInviters(limit = 10) {
  const sql = await db();
  return sql`SELECT i.code, i.name, i.visits,
      (SELECT count(*)::int FROM invites j WHERE j.referred_by = i.code) AS joined,
      (SELECT count(*)::int FROM problems p WHERE p.referred_by = i.code AND p.status = 'live') AS problems
    FROM invites i
    ORDER BY joined DESC, problems DESC, i.visits DESC, i.created_at ASC
    LIMIT ${limit}`;
}

export async function getInviteForVisitor(visitorId) {
  if (!visitorId) return null;
  const sql = await db();
  const rows = await sql`SELECT i.code, i.name, i.visits,
      (SELECT count(*)::int FROM invites j WHERE j.referred_by = i.code) AS joined,
      (SELECT count(*)::int FROM problems p WHERE p.referred_by = i.code) AS problems
    FROM invites i WHERE i.visitor_id = ${visitorId} LIMIT 1`;
  return rows[0] || null;
}
