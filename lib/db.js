import { neon } from '@neondatabase/serverless';
import { SEED_COMPANIES } from './seed';
import { CONTINENT_OF } from './geo';

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

  // Seed once. The insert into meta is atomic, so concurrent cold starts
  // cannot seed twice.
  const claimed = await sql`INSERT INTO meta (key, value) VALUES ('seeded_v1', now()::text)
    ON CONFLICT (key) DO NOTHING RETURNING key`;
  if (claimed.length > 0) {
    const names = SEED_COMPANIES.map((c) => c[0]);
    const countries = SEED_COMPANIES.map((c) => c[1]);
    const continents = SEED_COMPANIES.map((c) => CONTINENT_OF[c[1]] || 'Other');
    const industries = SEED_COMPANIES.map((c) => c[2]);
    const problems = SEED_COMPANIES.map((c) => c[3]);
    await sql`INSERT INTO companies (name, country, continent, industry, problem)
      SELECT * FROM unnest(${names}::text[], ${countries}::text[], ${continents}::text[], ${industries}::text[], ${problems}::text[])
      ON CONFLICT (name) DO NOTHING`;
  }
}
