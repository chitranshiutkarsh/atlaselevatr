import { db } from '@/lib/db';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENT_OF } from '@/lib/geo';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

function text(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export async function POST(request) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const body = await request.json().catch(() => ({}));
  const name = text(body.name, 100);
  const problem = text(body.problem, 300);
  const country = body.country;
  const industry = INDUSTRIES.includes(body.industry) ? body.industry : 'Other';
  let website = text(body.website, 300) || null;
  const city = text(body.city, 60) || null;
  const sector = text(body.sector, 60) || null;
  const isUnicorn = Boolean(body.is_unicorn);
  if (name.length < 2) return jsonError('Company name is required.');
  if (problem.length < 8) return jsonError('Describe the problem the company solves.');
  if (!CONTINENT_OF[country]) return jsonError('Pick a country.');
  if (website && !/^https?:\/\//.test(website)) website = `https://${website}`;

  const sql = await db();
  const rows = await sql`INSERT INTO companies (name, country, continent, industry, problem, website, city, sector, is_unicorn)
    VALUES (${name}, ${country}, ${CONTINENT_OF[country]}, ${industry}, ${problem}, ${website}, ${city}, ${sector}, ${isUnicorn})
    ON CONFLICT (name) DO UPDATE SET country = EXCLUDED.country, continent = EXCLUDED.continent,
      industry = EXCLUDED.industry, problem = EXCLUDED.problem, website = EXCLUDED.website,
      city = EXCLUDED.city, sector = EXCLUDED.sector, is_unicorn = EXCLUDED.is_unicorn
    RETURNING id, name, country, industry, problem, website, city, sector, is_unicorn`;
  return Response.json({ company: rows[0] }, { status: 201 });
}
