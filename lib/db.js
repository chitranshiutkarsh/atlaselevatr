import { neon } from '@neondatabase/serverless';
import { SEED_COMPANIES } from './seed';
import { CONTINENT_OF } from './geo';
import INDIA from './data/india-startups.json';
import GLOBAL from './data/global-startups.json';
import { INDIA_UNICORNS, ALIASES, INDIA_EXTRA } from './data/india-unicorns';
import { SEED_PROBLEMS } from './data/seed-problems';

let client;
let ready;

function getClient() {
  if (!client) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set. Connect a Neon database in Vercel → Storage.');
    }
    client = neon(url);
  }
  return client;
}

// Returns a ready-to-use SQL tagged template. Tables are created and data is
// loaded on first use, so a fresh database needs no manual setup.
export async function db() {
  const sql = getClient();
  if (!ready) {
    ready = migrate(sql).catch((err) => {
      ready = undefined;
      throw err;
    });
  }
  await ready;
  return sql;
}

const SCHEMA_VERSION = '4';
const CHUNK = 400;

function chunks(list, size = CHUNK) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// Runs fn on each chunk, remembering finished chunks so a step cut short by a
// function timeout resumes where it stopped instead of starting over.
async function eachChunk(sql, ctx, list, fn) {
  const parts = chunks(list);
  for (let i = 0; i < parts.length; i++) {
    const mark = `${ctx.key}#${i}`;
    if (ctx.done.has(mark)) continue;
    await fn(parts[i]);
    await sql`INSERT INTO meta (key, value) VALUES (${mark}, now()::text) ON CONFLICT (key) DO NOTHING`;
  }
}

async function migrate(sql) {
  await sql`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`;
  const meta = await sql`SELECT key, value FROM meta`;
  const done = new Set(meta.map((r) => r.key));
  const schema = meta.find((r) => r.key === 'schema_version');

  if (!schema || schema.value !== SCHEMA_VERSION) {
    await ensureSchema(sql);
    await sql`INSERT INTO meta (key, value) VALUES ('schema_version', ${SCHEMA_VERSION})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }

  const pending = DATA_STEPS.filter(([key]) => !done.has(key));
  if (pending.length === 0) return;

  // Only one instance loads data at a time; others serve what is there.
  const lock = await sql`INSERT INTO meta (key, value) VALUES ('data_lock', now()::text)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      WHERE meta.value::timestamptz < now() - interval '2 minutes'
    RETURNING key`;
  if (lock.length === 0) return;

  try {
    for (const [key, run] of pending) {
      try {
        await run(sql, { key, done });
        await sql`INSERT INTO meta (key, value) VALUES (${key}, now()::text) ON CONFLICT (key) DO NOTHING`;
        await sql`DELETE FROM meta WHERE key = ${`error:${key}`}`;
      } catch (err) {
        // Record the failure and keep the site up; /status shows it.
        console.error(`data step ${key} failed`, err);
        await sql`INSERT INTO meta (key, value) VALUES (${`error:${key}`}, ${String(err?.message || err).slice(0, 500)})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`.catch(() => {});
      }
    }
  } finally {
    await sql`DELETE FROM meta WHERE key = 'data_lock'`.catch(() => {});
  }
}

async function ensureSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    country TEXT NOT NULL,
    continent TEXT NOT NULL,
    industry TEXT NOT NULL,
    problem TEXT NOT NULL,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS sector TEXT,
    ADD COLUMN IF NOT EXISTS is_unicorn BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_funded INTEGER`;
  await sql`CREATE INDEX IF NOT EXISTS companies_scope_idx ON companies (country, industry)`;
  await sql`CREATE INDEX IF NOT EXISTS companies_continent_idx ON companies (continent, industry)`;
  await sql`CREATE INDEX IF NOT EXISTS companies_unicorn_idx ON companies (is_unicorn) WHERE is_unicorn`;
  await sql`CREATE INDEX IF NOT EXISTS companies_lower_name_idx ON companies (lower(name))`;

  await sql`CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    details TEXT,
    industry TEXT NOT NULL,
    solution TEXT,
    country TEXT NOT NULL,
    continent TEXT NOT NULL,
    author TEXT,
    referred_by TEXT,
    visitor_id TEXT,
    ip_hash TEXT,
    votes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'live',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`ALTER TABLE problems ALTER COLUMN solution DROP NOT NULL`;
  await sql`ALTER TABLE problems ADD COLUMN IF NOT EXISTS source TEXT, ADD COLUMN IF NOT EXISTS source_url TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS problems_rank_idx ON problems (status, votes DESC, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS problems_country_idx ON problems (country)`;
  await sql`CREATE INDEX IF NOT EXISTS problems_ip_idx ON problems (ip_hash, created_at)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS problems_seed_title_idx ON problems (title) WHERE source IS NOT NULL`;

  await sql`CREATE TABLE IF NOT EXISTS votes (
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (problem_id, visitor_id)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS problem_comments (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'solution',
    body TEXT NOT NULL,
    author TEXT,
    visitor_id TEXT,
    ip_hash TEXT,
    helpful INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'live',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS comments_problem_idx ON problem_comments (problem_id, status, helpful DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS comments_ip_idx ON problem_comments (ip_hash, created_at)`;
  await sql`CREATE TABLE IF NOT EXISTS comment_votes (
    comment_id INTEGER NOT NULL REFERENCES problem_comments(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (comment_id, visitor_id)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    source TEXT NOT NULL,
    url TEXT NOT NULL,
    focus TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS invites (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    visitor_id TEXT,
    referred_by TEXT,
    ip_hash TEXT,
    visits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS invites_visitor_idx ON invites (visitor_id) WHERE visitor_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS invites_ref_idx ON invites (referred_by)`;

  await sql`CREATE TABLE IF NOT EXISTS company_submissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    industry TEXT NOT NULL,
    sector TEXT,
    city TEXT,
    problem TEXT NOT NULL,
    website TEXT,
    founded INTEGER,
    submitter TEXT,
    contact TEXT,
    visitor_id TEXT,
    ip_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
}

// One-time data loads, in order. Each records itself in meta once done, so it
// never re-runs (e.g. after an admin deletes something it added).
const DATA_STEPS = [
  [
    'seeded_v1',
    async (sql) => {
      const rows = SEED_COMPANIES;
      await sql`INSERT INTO companies (name, country, continent, industry, problem, is_unicorn)
        SELECT n, c, ct, i, p, true
        FROM unnest(${rows.map((r) => r[0])}::text[], ${rows.map((r) => r[1])}::text[],
                    ${rows.map((r) => CONTINENT_OF[r[1]] || 'Other')}::text[], ${rows.map((r) => r[2])}::text[],
                    ${rows.map((r) => r[3])}::text[]) AS t(n, c, ct, i, p)
        ON CONFLICT (name) DO NOTHING`;
    },
  ],
  [
    'unicorns_v1',
    async (sql) => {
      await sql`UPDATE companies SET is_unicorn = true WHERE name = ANY(${SEED_COMPANIES.map((r) => r[0])}::text[])`;
    },
  ],
  [
    'india_v2',
    async (sql, ctx) => {
      // [name, city, industry, sector, description, lastFundedYear, isUnicorn]
      await eachChunk(sql, ctx, INDIA, async (part) => {
        await sql`INSERT INTO companies (name, country, continent, industry, problem, city, sector, last_funded, is_unicorn)
          SELECT n, 'India', 'Asia', i, p, c, s, y, u
          FROM unnest(${part.map((r) => r[0])}::text[], ${part.map((r) => r[1] || null)}::text[],
                      ${part.map((r) => r[2])}::text[], ${part.map((r) => r[3] || null)}::text[],
                      ${part.map((r) => r[4] || `${r[3] || r[2]} startup`)}::text[],
                      ${part.map((r) => r[5] || null)}::int[], ${part.map((r) => r[6] === 1)}::boolean[])
            AS t(n, c, i, s, p, y, u)
          ON CONFLICT (name) DO UPDATE SET
            city = COALESCE(companies.city, EXCLUDED.city),
            sector = COALESCE(companies.sector, EXCLUDED.sector),
            last_funded = COALESCE(companies.last_funded, EXCLUDED.last_funded),
            is_unicorn = companies.is_unicorn OR EXCLUDED.is_unicorn
          WHERE companies.country = 'India'`;
      });
    },
  ],
  [
    'india_unicorns_v3',
    async (sql) => {
      // Fold alternate names in the funding data into the unicorn's name.
      for (const [canonical, aliases] of Object.entries(ALIASES)) {
        const [first, ...rest] = aliases;
        await sql`UPDATE companies SET name = ${canonical}
          WHERE lower(name) = lower(${first}) AND country = 'India'
            AND NOT EXISTS (SELECT 1 FROM companies WHERE lower(name) = lower(${canonical}))`;
        if (rest.length) {
          await sql`DELETE FROM companies WHERE country = 'India' AND lower(name) = ANY(${rest.map((a) => a.toLowerCase())}::text[])
            AND EXISTS (SELECT 1 FROM companies WHERE lower(name) = lower(${canonical}))`;
        }
      }
      const u = INDIA_UNICORNS;
      const n = u.map((r) => r[0]);
      const i = u.map((r) => r[1]);
      const s = u.map((r) => r[2]);
      const c = u.map((r) => r[3]);
      const p = u.map((r) => r[4]);
      await sql`UPDATE companies AS co SET is_unicorn = true, industry = t.i, sector = t.s,
          city = COALESCE(t.c, co.city), problem = t.p
        FROM unnest(${n}::text[], ${i}::text[], ${s}::text[], ${c}::text[], ${p}::text[]) AS t(n, i, s, c, p)
        WHERE lower(co.name) = lower(t.n) AND co.country = 'India'`;
      await sql`INSERT INTO companies (name, country, continent, industry, sector, city, problem, is_unicorn)
        SELECT t.n, 'India', 'Asia', t.i, t.s, t.c, t.p, true
        FROM unnest(${n}::text[], ${i}::text[], ${s}::text[], ${c}::text[], ${p}::text[]) AS t(n, i, s, c, p)
        WHERE NOT EXISTS (SELECT 1 FROM companies WHERE lower(name) = lower(t.n))
        ON CONFLICT (name) DO NOTHING`;
    },
  ],
  [
    'india_extra_v2',
    async (sql) => {
      for (const [name, industry, sector, city, problem, year] of INDIA_EXTRA) {
        await sql`INSERT INTO companies (name, country, continent, industry, sector, city, problem, last_funded)
          SELECT ${name}, 'India', 'Asia', ${industry}, ${sector}, ${city}, ${problem}, ${year}
          WHERE NOT EXISTS (SELECT 1 FROM companies WHERE lower(name) = lower(${name}))
          ON CONFLICT (name) DO NOTHING`;
      }
    },
  ],
  [
    'global_v1',
    async (sql, ctx) => {
      // [name, country, city, industry, sector, description, year, isUnicorn]
      await eachChunk(sql, ctx, GLOBAL, async (part) => {
        await sql`INSERT INTO companies (name, country, continent, city, industry, sector, problem, last_funded, is_unicorn)
          SELECT t.n, t.co, t.ct, t.ci, t.i, t.s, t.p, t.y, t.u
          FROM unnest(${part.map((r) => r[0])}::text[], ${part.map((r) => r[1])}::text[],
                      ${part.map((r) => CONTINENT_OF[r[1]] || 'Other')}::text[], ${part.map((r) => r[2] || null)}::text[],
                      ${part.map((r) => r[3])}::text[], ${part.map((r) => r[4] || null)}::text[],
                      ${part.map((r) => r[5] || `${r[4] || r[3]} startup`)}::text[], ${part.map((r) => r[6] || null)}::int[],
                      ${part.map((r) => r[7] === 1)}::boolean[])
            AS t(n, co, ct, ci, i, s, p, y, u)
          WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE lower(c.name) = lower(t.n))
          ON CONFLICT (name) DO NOTHING`;
      });
    },
  ],
  [
    'problems_v1',
    async (sql) => {
      // [title, details, industry, country, source, sourceUrl]
      const p = SEED_PROBLEMS;
      await sql`INSERT INTO problems (title, details, industry, country, continent, source, source_url, author)
        SELECT t.ti, t.d, t.i, t.c, t.ct, t.s, t.u, NULL
        FROM unnest(${p.map((r) => r[0])}::text[], ${p.map((r) => r[1])}::text[], ${p.map((r) => r[2])}::text[],
                    ${p.map((r) => r[3])}::text[], ${p.map((r) => CONTINENT_OF[r[3]] || 'Other')}::text[],
                    ${p.map((r) => r[4])}::text[], ${p.map((r) => r[5])}::text[]) AS t(ti, d, i, c, ct, s, u)
        WHERE NOT EXISTS (SELECT 1 FROM problems pr WHERE pr.title = t.ti)`;
    },
  ],
];

export const DATA_STEP_KEYS = DATA_STEPS.map(([key]) => key);

// Health check used by /status: data steps done, failed or pending, and counts.
export async function dataStatus() {
  const sql = await db();
  const meta = await sql`SELECT key, value FROM meta`;
  const map = Object.fromEntries(meta.map((r) => [r.key, r.value]));
  const [counts] = await sql`SELECT
      (SELECT count(*)::int FROM companies) AS companies,
      (SELECT count(*)::int FROM companies WHERE country = 'India') AS india,
      (SELECT count(*)::int FROM companies WHERE country <> 'India') AS global,
      (SELECT count(*)::int FROM companies WHERE is_unicorn) AS unicorns,
      (SELECT count(*)::int FROM problems) AS problems,
      (SELECT count(*)::int FROM problem_comments) AS comments`;
  return {
    counts,
    steps: DATA_STEP_KEYS.map((key) => ({
      key,
      state: map[key] ? 'done' : map[`error:${key}`] ? 'failed' : 'pending',
      error: map[`error:${key}`] || null,
    })),
    loading: Boolean(map.data_lock),
  };
}
