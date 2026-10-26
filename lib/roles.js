import { db } from './db';

// Queries behind "find work on the problems you care about".
// A role is shown only when its startup's careers board is verified. Each
// role is linked to the problems its startup works on through job_links.

function likePattern(q) {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

// ---------- Problems someone cares about ----------

export async function caredProblemIds({ visitorId = null, userId = null } = {}) {
  if (!visitorId && !userId) return [];
  const sql = await db();
  const rows = await sql`SELECT DISTINCT problem_id FROM cares
    WHERE (${visitorId}::text IS NOT NULL AND visitor_id = ${visitorId})
       OR (${userId}::int IS NOT NULL AND user_id = ${userId})`;
  return rows.map((r) => r.problem_id);
}

export async function listCaredProblems(ids) {
  if (!ids.length) return [];
  const sql = await db();
  return sql`SELECT p.id, p.title, p.industry, p.country, p.votes, p.cares,
      (SELECT count(*)::int FROM roles r JOIN job_links m ON m.company_id = r.company_id
         JOIN careers_boards b ON b.company_id = r.company_id AND b.status = 'verified'
       WHERE m.problem_id = p.id AND r.active) AS roles
    FROM problems p WHERE p.id = ANY(${ids}::int[]) AND p.status = 'live'
    ORDER BY p.votes DESC`;
}

// Problems to pick from when someone hasn't chosen any yet: the most faced,
// with the ones that have open roles first.
export async function pickerProblems({ limit = 12 } = {}) {
  const sql = await db();
  return sql`SELECT p.id, p.title, p.industry, p.country, p.votes, p.cares,
      (SELECT count(*)::int FROM roles r JOIN job_links m ON m.company_id = r.company_id
         JOIN careers_boards b ON b.company_id = r.company_id AND b.status = 'verified'
       WHERE m.problem_id = p.id AND r.active) AS roles
    FROM problems p WHERE p.status = 'live'
    ORDER BY (SELECT count(*) FROM job_links m JOIN careers_boards b ON b.company_id = m.company_id
               AND b.status = 'verified' AND b.open_roles > 0 WHERE m.problem_id = p.id) > 0 DESC,
      p.votes + p.cares DESC, p.created_at DESC
    LIMIT ${limit}`;
}

// Every problem with open roles at the startups working on it, most roles first.
export async function problemsWithRoles({ q = null, industry = null } = {}) {
  const sql = await db();
  const like = q ? likePattern(q) : null;
  return sql`SELECT p.id, p.title, p.industry, p.country, p.votes, p.cares,
      count(r.id)::int AS roles, count(DISTINCT r.company_id)::int AS startups,
      (SELECT string_agg(x.name, ' · ') FROM (
         SELECT c.name FROM job_links m2
         JOIN careers_boards b2 ON b2.company_id = m2.company_id AND b2.status = 'verified' AND b2.open_roles > 0
         JOIN companies c ON c.id = m2.company_id
         WHERE m2.problem_id = p.id ORDER BY m2.score DESC LIMIT 3) x) AS companies
    FROM problems p
    JOIN job_links m ON m.problem_id = p.id
    JOIN careers_boards b ON b.company_id = m.company_id AND b.status = 'verified'
    JOIN roles r ON r.company_id = m.company_id AND r.active
    WHERE p.status = 'live'
      AND (${industry}::text IS NULL OR p.industry = ${industry})
      AND (${like}::text IS NULL OR p.title ILIKE ${like} OR p.details ILIKE ${like})
    GROUP BY p.id
    ORDER BY roles DESC, p.votes + p.cares DESC, p.created_at DESC`;
}

// How many live problems are still waiting to be linked to startups.
export async function problemsAwaitingMatches() {
  const sql = await db();
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM problems p
    LEFT JOIN problem_coverage pc ON pc.problem_id = p.id
    WHERE p.status = 'live' AND (pc.problem_id IS NULL OR pc.matched_at IS NULL)`;
  return n;
}

// ---------- Roles ----------

// The jobs feed. `focus` (problem ids) limits it to startups working on those
// problems: the problems someone cares about, or one problem.
export async function listRoles({
  focus = null,
  kind = null,
  country = null,
  remote = false,
  industry = null,
  companyId = null,
  q = null,
  limit = 30,
  offset = 0,
} = {}) {
  const sql = await db();
  const lim = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 60);
  const off = Math.max(parseInt(offset, 10) || 0, 0);
  const like = q ? likePattern(q) : null;
  const useFocus = Array.isArray(focus);
  const ids = useFocus ? focus : [];
  const rem = remote ? true : null;

  const rows = await sql`WITH scope AS (
      SELECT m.company_id, max(m.score) AS score FROM job_links m
      WHERE m.problem_id = ANY(${ids}::int[]) GROUP BY m.company_id
    ),
    picked AS (
      SELECT r.*, s.score AS focus_score,
        row_number() OVER (PARTITION BY r.company_id ORDER BY coalesce(r.posted_at, r.first_seen) DESC, r.id DESC) AS rn
      FROM roles r
      JOIN careers_boards b ON b.company_id = r.company_id AND b.status = 'verified'
      JOIN companies c ON c.id = r.company_id
      LEFT JOIN scope s ON s.company_id = r.company_id
      WHERE r.active
        AND (${useFocus}::boolean = false OR s.company_id IS NOT NULL)
        AND (${kind}::text IS NULL OR r.kind = ${kind})
        AND (${country}::text IS NULL OR r.country = ${country})
        AND (${rem}::boolean IS NULL OR r.remote)
        AND (${industry}::text IS NULL OR c.industry = ${industry})
        AND (${companyId}::int IS NULL OR r.company_id = ${companyId})
        AND (${companyId}::int IS NOT NULL OR EXISTS (SELECT 1 FROM job_links pm JOIN problems pp ON pp.id = pm.problem_id AND pp.status = 'live' WHERE pm.company_id = r.company_id))
        AND (${like}::text IS NULL OR r.title ILIKE ${like} OR c.name ILIKE ${like} OR r.team ILIKE ${like})
    )
    SELECT x.id, x.title, x.team, x.location, x.country, x.remote, x.kind, x.url, x.employment,
      coalesce(x.posted_at, x.first_seen) AS posted_at,
      c.id AS company_id, c.name AS company, c.industry, c.is_unicorn, c.city AS company_city,
      top.problem_id, top.problem, top.votes, top.cares,
      count(*) OVER () AS total
    FROM picked x
    JOIN companies c ON c.id = x.company_id
    LEFT JOIN LATERAL (
      SELECT p.id AS problem_id, p.title AS problem, p.votes, p.cares
      FROM job_links m JOIN problems p ON p.id = m.problem_id AND p.status = 'live'
      WHERE m.company_id = x.company_id
      ORDER BY (m.problem_id = ANY(${ids}::int[])) DESC, m.score DESC, p.votes DESC
      LIMIT 1
    ) top ON true
    ORDER BY (top.problem_id IS NOT NULL) DESC, x.rn ASC, x.focus_score DESC NULLS LAST,
      coalesce(x.posted_at, x.first_seen) DESC, x.id DESC
    LIMIT ${lim} OFFSET ${off}`;
  const total = rows[0] ? Number(rows[0].total) : 0;
  return { roles: rows.map(({ total: _t, ...r }) => ({ ...r, posted_at: r.posted_at ? new Date(r.posted_at).toISOString() : null })), total };
}

// Filters for the jobs page: role types and countries with open roles.
export async function roleFacets() {
  const sql = await db();
  const [kinds, countries] = await Promise.all([
    sql`SELECT r.kind, count(*)::int AS n FROM roles r JOIN careers_boards b ON b.company_id = r.company_id AND b.status = 'verified'
      WHERE r.active AND EXISTS (SELECT 1 FROM job_links pm JOIN problems pp ON pp.id = pm.problem_id AND pp.status = 'live' WHERE pm.company_id = r.company_id) GROUP BY r.kind ORDER BY n DESC`,
    sql`SELECT r.country, count(*)::int AS n FROM roles r JOIN careers_boards b ON b.company_id = r.company_id AND b.status = 'verified'
      WHERE r.active AND r.country IS NOT NULL AND EXISTS (SELECT 1 FROM job_links pm JOIN problems pp ON pp.id = pm.problem_id AND pp.status = 'live' WHERE pm.company_id = r.company_id) GROUP BY r.country ORDER BY n DESC LIMIT 20`,
  ]);
  return { kinds, countries };
}

export async function jobsStats() {
  const sql = await db();
  const [row] = await sql`SELECT
      (SELECT count(*)::int FROM roles r JOIN careers_boards b ON b.company_id = r.company_id AND b.status = 'verified'
         WHERE r.active AND EXISTS (SELECT 1 FROM job_links pm JOIN problems pp ON pp.id = pm.problem_id AND pp.status = 'live' WHERE pm.company_id = r.company_id)) AS roles,
      (SELECT count(*)::int FROM careers_boards b WHERE b.status = 'verified' AND b.open_roles > 0
         AND EXISTS (SELECT 1 FROM job_links pm JOIN problems pp ON pp.id = pm.problem_id AND pp.status = 'live' WHERE pm.company_id = b.company_id)) AS hiring,
      (SELECT count(DISTINCT m.problem_id)::int FROM job_links m
         JOIN careers_boards b ON b.company_id = m.company_id AND b.status = 'verified' AND b.open_roles > 0
         JOIN problems p ON p.id = m.problem_id AND p.status = 'live') AS problems_with_roles,
      (SELECT count(*)::int FROM companies WHERE careers_checked IS NOT NULL) AS checked,
      (SELECT count(*)::int FROM companies) AS companies`;
  return row;
}

// "Work on this problem": open roles at the startups working on it, one per
// startup first, best-matched startups first.
export async function rolesForProblem(problemId, { limit = 6 } = {}) {
  const sql = await db();
  const [roles, [counts], links] = await Promise.all([
    sql`SELECT x.id, x.title, x.location, x.remote, x.kind, x.url, coalesce(x.posted_at, x.first_seen) AS posted_at,
        c.id AS company_id, c.name AS company, c.is_unicorn
      FROM (
        SELECT r.*, m.score,
          row_number() OVER (PARTITION BY r.company_id ORDER BY coalesce(r.posted_at, r.first_seen) DESC, r.id DESC) AS rn
        FROM job_links m
        JOIN careers_boards b ON b.company_id = m.company_id AND b.status = 'verified'
        JOIN roles r ON r.company_id = m.company_id AND r.active
        WHERE m.problem_id = ${problemId}
      ) x JOIN companies c ON c.id = x.company_id
      ORDER BY x.rn ASC, x.score DESC, posted_at DESC
      LIMIT ${limit}`,
    sql`SELECT count(*)::int AS roles, count(DISTINCT r.company_id)::int AS companies
      FROM job_links m
      JOIN careers_boards b ON b.company_id = m.company_id AND b.status = 'verified'
      JOIN roles r ON r.company_id = m.company_id AND r.active
      WHERE m.problem_id = ${problemId}`,
    sql`SELECT c.id, c.name, b.token AS url FROM job_links m
      JOIN careers_boards b ON b.company_id = m.company_id AND b.status = 'verified' AND b.ats = 'link'
      JOIN companies c ON c.id = m.company_id
      WHERE m.problem_id = ${problemId}
      ORDER BY m.score DESC LIMIT 4`,
  ]);
  return {
    roles: roles.map((r) => ({ ...r, posted_at: r.posted_at ? new Date(r.posted_at).toISOString() : null })),
    total: counts?.roles || 0,
    companies: counts?.companies || 0,
    careerLinks: links,
  };
}

// Small strip of fresh roles on problems people face most (home page).
export async function rolesOnTopProblems({ limit = 6 } = {}) {
  const { roles } = await listRoles({ limit });
  return roles;
}

// Roles posted in the last week for the weekly email.
export async function newRolesForDigest({ problemIds = [], industries = null, country = null, limit = 5 } = {}) {
  const sql = await db();
  const inds = industries && industries.length ? industries : null;
  const ids = problemIds || [];
  return sql`SELECT DISTINCT ON (r.company_id) r.id, r.title, r.url, r.location, r.remote, c.name AS company,
      (SELECT p.title FROM job_links m JOIN problems p ON p.id = m.problem_id AND p.status = 'live'
        WHERE m.company_id = r.company_id ORDER BY (m.problem_id = ANY(${ids}::int[])) DESC, m.score DESC LIMIT 1) AS problem
    FROM roles r
    JOIN careers_boards b ON b.company_id = r.company_id AND b.status = 'verified'
    JOIN companies c ON c.id = r.company_id
    WHERE r.active AND r.first_seen > now() - interval '7 days'
      AND EXISTS (SELECT 1 FROM job_links m WHERE m.company_id = r.company_id
                  AND (cardinality(${ids}::int[]) = 0 OR m.problem_id = ANY(${ids}::int[])))
      AND (${inds}::text[] IS NULL OR cardinality(${ids}::int[]) > 0 OR c.industry = ANY(${inds}::text[]))
      AND (${country}::text IS NULL OR r.country = ${country} OR (r.remote AND r.country IS NULL))
    ORDER BY r.company_id, r.first_seen DESC
    LIMIT ${limit}`;
}
