import { db } from './db';

export async function getAtlasData() {
  const sql = await db();
  const [unicorns, companyCounts, problemCounts] = await Promise.all([
    sql`SELECT id, name, country, continent, industry, problem, website, city
        FROM companies WHERE is_unicorn ORDER BY name`,
    sql`SELECT country, count(*)::int AS companies FROM companies GROUP BY country`,
    sql`SELECT country, count(*)::int AS problems, coalesce(sum(votes), 0)::int AS votes
        FROM problems WHERE status = 'live' GROUP BY country`,
  ]);
  const countryCounts = {};
  for (const row of companyCounts) countryCounts[row.country] = { companies: row.companies, problems: 0, votes: 0 };
  for (const row of problemCounts) {
    countryCounts[row.country] = { companies: 0, ...countryCounts[row.country], problems: row.problems, votes: row.votes };
  }
  return { unicorns, countryCounts };
}

function likePattern(q) {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

// Paginated, filterable startup directory with category and city counts.
export async function listCompanies({
  country = null,
  continent = null,
  industry = null,
  city = null,
  q = null,
  unicorn = false,
  limit = 24,
  offset = 0,
} = {}) {
  const sql = await db();
  const lim = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);
  const off = Math.max(parseInt(offset, 10) || 0, 0);
  const like = q ? likePattern(q) : null;
  const uni = unicorn ? true : null;

  const [rows, [{ total }], industries, cities] = await Promise.all([
    sql`SELECT id, name, country, continent, industry, sector, problem, city, website, is_unicorn, last_funded
      FROM companies
      WHERE (${country}::text IS NULL OR country = ${country})
        AND (${continent}::text IS NULL OR continent = ${continent})
        AND (${industry}::text IS NULL OR industry = ${industry})
        AND (${city}::text IS NULL OR city = ${city})
        AND (${uni}::boolean IS NULL OR is_unicorn = ${uni})
        AND (${like}::text IS NULL OR name ILIKE ${like} OR problem ILIKE ${like} OR sector ILIKE ${like})
      ORDER BY is_unicorn DESC, last_funded DESC NULLS LAST, name ASC
      LIMIT ${lim} OFFSET ${off}`,
    sql`SELECT count(*)::int AS total FROM companies
      WHERE (${country}::text IS NULL OR country = ${country})
        AND (${continent}::text IS NULL OR continent = ${continent})
        AND (${industry}::text IS NULL OR industry = ${industry})
        AND (${city}::text IS NULL OR city = ${city})
        AND (${uni}::boolean IS NULL OR is_unicorn = ${uni})
        AND (${like}::text IS NULL OR name ILIKE ${like} OR problem ILIKE ${like} OR sector ILIKE ${like})`,
    sql`SELECT industry, count(*)::int AS count FROM companies
      WHERE (${country}::text IS NULL OR country = ${country})
        AND (${continent}::text IS NULL OR continent = ${continent})
        AND (${city}::text IS NULL OR city = ${city})
        AND (${uni}::boolean IS NULL OR is_unicorn = ${uni})
        AND (${like}::text IS NULL OR name ILIKE ${like} OR problem ILIKE ${like} OR sector ILIKE ${like})
      GROUP BY industry ORDER BY count DESC`,
    sql`SELECT city, count(*)::int AS count FROM companies
      WHERE city IS NOT NULL AND city <> ''
        AND (${country}::text IS NULL OR country = ${country})
        AND (${continent}::text IS NULL OR continent = ${continent})
        AND (${industry}::text IS NULL OR industry = ${industry})
        AND (${uni}::boolean IS NULL OR is_unicorn = ${uni})
        AND (${like}::text IS NULL OR name ILIKE ${like} OR problem ILIKE ${like} OR sector ILIKE ${like})
      GROUP BY city ORDER BY count DESC LIMIT 15`,
  ]);
  return { companies: rows, total, industries, cities };
}

// Atlas score: a transparent merit score from real activity only.
//   votes ×3, people who want to build it ×8, solutions ×4, other comments ×1,
//   "helpful" marks ×1, 2·ln(1+views), +5 if backed by a public source,
//   and a freshness bonus (up to +10) that fades over about two weeks.
export const MERIT_FORMULA =
  'votes ×3 · builders ×8 · solutions ×4 · comments ×1 · helpful marks ×1 · 2·ln(1+views) · +5 if sourced · up to +10 freshness';

export async function listProblems({ continent = null, country = null, industry = null, sort = 'top', limit = 50, offset = 0 } = {}) {
  const sql = await db();
  const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const off = Math.max(parseInt(offset, 10) || 0, 0);
  const mode = ['top', 'new', 'merit', 'discover'].includes(sort) ? sort : 'top';
  // One query; the ORDER BY key is chosen by mode inside SQL.
  return sql`WITH base AS (
      SELECT p.id, p.title, p.details, p.industry, p.solution, p.country, p.continent, p.author, p.votes, p.views,
        p.created_at, p.source, p.source_url,
        (SELECT count(*)::int FROM problem_comments c WHERE c.problem_id = p.id AND c.status = 'live') AS comments,
        (SELECT count(*)::int FROM problem_comments c WHERE c.problem_id = p.id AND c.status = 'live' AND c.kind = 'solution') AS solutions,
        (SELECT coalesce(sum(c.helpful), 0)::int FROM problem_comments c WHERE c.problem_id = p.id AND c.status = 'live') AS helpful,
        (SELECT count(*)::int FROM builder_interests b WHERE b.problem_id = p.id) AS builders
      FROM problems p
      WHERE p.status = 'live'
        AND (${continent}::text IS NULL OR p.continent = ${continent})
        AND (${country}::text IS NULL OR p.country = ${country})
        AND (${industry}::text IS NULL OR p.industry = ${industry})
    ), scored AS (
      SELECT *, round((
          votes * 3 + builders * 8 + solutions * 4 + (comments - solutions) + helpful
          + 2 * ln(1 + views)
          + CASE WHEN source IS NOT NULL THEN 5 ELSE 0 END
          + 10 * exp(-extract(epoch FROM now() - created_at) / 86400.0 / 14)
        )::numeric, 1)::float AS merit
      FROM base
    )
    SELECT * FROM scored
    ORDER BY
      CASE WHEN ${mode}::text = 'top' THEN votes END DESC NULLS LAST,
      CASE WHEN ${mode}::text = 'merit' THEN merit END DESC NULLS LAST,
      CASE WHEN ${mode}::text = 'discover' THEN power(random(), 1.0 / (merit + 5)) END DESC NULLS LAST,
      created_at DESC
    LIMIT ${lim} OFFSET ${off}`;
}

export async function getProblem(id) {
  const sql = await db();
  const rows = await sql`SELECT id, title, details, industry, solution, country, continent, author, votes, views, created_at,
      source, source_url,
      (SELECT count(*)::int FROM builder_interests b WHERE b.problem_id = problems.id) AS builders
    FROM problems WHERE id = ${id} AND status = 'live'`;
  return rows[0] || null;
}

export async function listComments(problemId) {
  const sql = await db();
  return sql`SELECT id, kind, body, author, helpful, created_at
    FROM problem_comments
    WHERE problem_id = ${problemId} AND status = 'live'
    ORDER BY helpful DESC, created_at ASC
    LIMIT 300`;
}

export async function getStats() {
  const sql = await db();
  const [totals] = await sql`SELECT /* stats v2 */
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
