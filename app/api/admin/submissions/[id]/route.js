import { db } from '@/lib/db';
import { CONTINENT_OF } from '@/lib/geo';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const id = parseInt(params.id, 10);
  const { action } = await request.json().catch(() => ({}));
  const sql = await db();
  const [sub] = await sql`SELECT * FROM company_submissions WHERE id = ${id}`;
  if (!sub) return jsonError('Submission not found', 404);

  if (action === 'reject') {
    await sql`UPDATE company_submissions SET status = 'rejected' WHERE id = ${id}`;
    return Response.json({ ok: true });
  }
  if (action !== 'approve') return jsonError('Unknown action');

  // Approving adds the startup, or fills in details for one already listed.
  const continent = CONTINENT_OF[sub.country] || 'Other';
  const [existing] = await sql`SELECT id FROM companies WHERE lower(name) = lower(${sub.name}) LIMIT 1`;
  if (existing) {
    await sql`UPDATE companies SET industry = ${sub.industry}, problem = ${sub.problem},
        sector = COALESCE(${sub.sector}, sector), city = COALESCE(${sub.city}, city),
        website = COALESCE(${sub.website}, website)
      WHERE id = ${existing.id}`;
  } else {
    await sql`INSERT INTO companies (name, country, continent, industry, sector, city, problem, website)
      VALUES (${sub.name}, ${sub.country}, ${continent}, ${sub.industry}, ${sub.sector}, ${sub.city}, ${sub.problem}, ${sub.website})`;
  }
  await sql`UPDATE company_submissions SET status = 'approved' WHERE id = ${id}`;
  return Response.json({ ok: true });
}
