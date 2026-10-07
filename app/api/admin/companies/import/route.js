import { db } from '@/lib/db';
import { CONTINENT_OF, COUNTRIES, prettyName } from '@/lib/geo';
import { categorize } from '@/lib/categorize';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_ROWS = 1000;

// Map "USA", "United States" etc. onto the map's country names.
const COUNTRY_LOOKUP = new Map();
for (const c of COUNTRIES) {
  COUNTRY_LOOKUP.set(c.toLowerCase(), c);
  COUNTRY_LOOKUP.set(prettyName(c).toLowerCase(), c);
}
for (const [alias, name] of [
  ['usa', 'United States of America'], ['us', 'United States of America'], ['uk', 'United Kingdom'],
  ['uae', 'United Arab Emirates'], ['england', 'United Kingdom'], ['korea', 'South Korea'], ['bharat', 'India'],
]) COUNTRY_LOOKUP.set(alias, name);

function text(v, max) {
  return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, max);
}

// Bulk-adds startups parsed from a CSV in the admin panel.
// Rows: { name, country, city, category, sector, description, website, year }
export async function POST(request) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const body = await request.json().catch(() => null);
  const rows = Array.isArray(body?.rows) ? body.rows.slice(0, MAX_ROWS) : null;
  if (!rows?.length) return jsonError('No rows to import');
  const update = Boolean(body.update);

  const clean = [];
  let invalid = 0;
  const seen = new Set();
  for (const r of rows) {
    const name = text(r.name, 100);
    const country = COUNTRY_LOOKUP.get(text(r.country, 60).toLowerCase()) || (r.country ? null : 'India');
    if (name.length < 2 || !country || seen.has(name.toLowerCase())) {
      invalid++;
      continue;
    }
    seen.add(name.toLowerCase());
    const sector = text(r.sector, 60) || null;
    const category = categorize(r.category, sector, r.description);
    const description = text(r.description, 400) || `${sector || category} startup`;
    let website = text(r.website, 300) || null;
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    const year = parseInt(r.year, 10);
    clean.push([name, country, CONTINENT_OF[country] || 'Other', text(r.city, 60) || null, category, sector, description, website,
      year > 1900 && year <= 2100 ? year : null]);
  }
  if (!clean.length) return Response.json({ inserted: 0, updated: 0, skipped: rows.length, invalid });

  const col = (i) => clean.map((r) => r[i]);
  const sql = await db();
  const inserted = await sql`INSERT INTO companies (name, country, continent, city, industry, sector, problem, website, last_funded)
    SELECT t.n, t.c, t.ct, t.ci, t.i, t.s, t.p, t.w, t.y
    FROM unnest(${col(0)}::text[], ${col(1)}::text[], ${col(2)}::text[], ${col(3)}::text[], ${col(4)}::text[],
                ${col(5)}::text[], ${col(6)}::text[], ${col(7)}::text[], ${col(8)}::int[]) AS t(n, c, ct, ci, i, s, p, w, y)
    WHERE NOT EXISTS (SELECT 1 FROM companies co WHERE lower(co.name) = lower(t.n))
    ON CONFLICT (name) DO NOTHING
    RETURNING id`;
  let updated = 0;
  if (update) {
    const res = await sql`UPDATE companies AS co SET
        city = COALESCE(t.ci, co.city), sector = COALESCE(t.s, co.sector), website = COALESCE(t.w, co.website),
        problem = CASE WHEN t.p LIKE '% startup' THEN co.problem ELSE t.p END
      FROM unnest(${col(0)}::text[], ${col(3)}::text[], ${col(5)}::text[], ${col(6)}::text[], ${col(7)}::text[])
        AS t(n, ci, s, p, w)
      WHERE lower(co.name) = lower(t.n) AND co.created_at < now() - interval '5 seconds'
      RETURNING co.id`;
    updated = res.length;
  }
  return Response.json({
    inserted: inserted.length,
    updated,
    skipped: clean.length - inserted.length - updated,
    invalid,
  });
}
