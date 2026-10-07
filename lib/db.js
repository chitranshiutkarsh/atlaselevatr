import { neon } from '@neondatabase/serverless';
import { SEED_COMPANIES } from './seed';
import { CONTINENT_OF } from './geo';
import INDIA from './data/india-startups.json';

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

// Returns a ready-to-use SQL tagged template. Tables are created and seeded on
// first use, so a fresh database needs no manual setup.
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

async function migrate(sql) {
  await sql`CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  )`;

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

  await sql`CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    details TEXT,
    industry TEXT NOT NULL,
    solution TEXT NOT NULL,
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
  await sql`CREATE INDEX IF NOT EXISTS problems_rank_idx ON problems (status, votes DESC, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS problems_country_idx ON problems (country)`;
  await sql`CREATE INDEX IF NOT EXISTS problems_ip_idx ON problems (ip_hash, created_at)`;

  await sql`CREATE TABLE IF NOT EXISTS votes (
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (problem_id, visitor_id)
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

  await sql`ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS sector TEXT,
    ADD COLUMN IF NOT EXISTS is_unicorn BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_funded INTEGER`;
  await sql`CREATE INDEX IF NOT EXISTS companies_scope_idx ON companies (country, industry)`;
  await sql`CREATE INDEX IF NOT EXISTS companies_unicorn_idx ON companies (is_unicorn) WHERE is_unicorn`;

  // One-time data steps. Each inserts idempotently, then records itself in
  // meta so it never re-runs (e.g. after an admin deletes a seeded company).
  const done = new Set((await sql`SELECT key FROM meta`).map((r) => r.key));

  if (!done.has('seeded_v1')) {
    const names = SEED_COMPANIES.map((c) => c[0]);
    const countries = SEED_COMPANIES.map((c) => c[1]);
    const continents = SEED_COMPANIES.map((c) => CONTINENT_OF[c[1]] || 'Other');
    const industries = SEED_COMPANIES.map((c) => c[2]);
    const problems = SEED_COMPANIES.map((c) => c[3]);
    await sql`INSERT INTO companies (name, country, continent, industry, problem, is_unicorn)
      SELECT n, c, ct, i, p, true FROM unnest(${names}::text[], ${countries}::text[], ${continents}::text[], ${industries}::text[], ${problems}::text[]) AS t(n, c, ct, i, p)
      ON CONFLICT (name) DO NOTHING`;
    await sql`INSERT INTO meta (key, value) VALUES ('seeded_v1', now()::text) ON CONFLICT (key) DO NOTHING`;
  }

  if (!done.has('unicorns_v1')) {
    const names = SEED_COMPANIES.map((c) => c[0]);
    await sql`UPDATE companies SET is_unicorn = true WHERE name = ANY(${names}::text[])`;
    await sql`INSERT INTO meta (key, value) VALUES ('unicorns_v1', now()::text) ON CONFLICT (key) DO NOTHING`;
  }

  if (!done.has('india_v1')) {
    // [name, city, industry, sector, description, lastFundedYear, isUnicorn]
    const names = INDIA.map((r) => r[0]);
    const cities = INDIA.map((r) => r[1] || null);
    const industries = INDIA.map((r) => r[2]);
    const sectors = INDIA.map((r) => r[3] || null);
    const problems = INDIA.map((r) => r[4] || (r[3] ? `${r[3]} startup` : `${r[2]} startup`));
    const years = INDIA.map((r) => r[5] || null);
    const unicorns = INDIA.map((r) => r[6] === 1);
    await sql`INSERT INTO companies (name, country, continent, industry, problem, city, sector, last_funded, is_unicorn)
      SELECT n, 'India', 'Asia', i, p, c, s, y, u
      FROM unnest(${names}::text[], ${cities}::text[], ${industries}::text[], ${sectors}::text[],
                  ${problems}::text[], ${years}::int[], ${unicorns}::boolean[]) AS t(n, c, i, s, p, y, u)
      ON CONFLICT (name) DO UPDATE SET
        city = COALESCE(companies.city, EXCLUDED.city),
        sector = COALESCE(companies.sector, EXCLUDED.sector),
        last_funded = COALESCE(companies.last_funded, EXCLUDED.last_funded),
        is_unicorn = companies.is_unicorn OR EXCLUDED.is_unicorn
      WHERE companies.country = 'India'`;
    await sql`INSERT INTO meta (key, value) VALUES ('india_v1', now()::text) ON CONFLICT (key) DO NOTHING`;
  }
}
