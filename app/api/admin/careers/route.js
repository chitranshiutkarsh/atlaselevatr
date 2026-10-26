import { db } from '@/lib/db';
import { addCareersLink, runJobsRefresh } from '@/lib/careers';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Admin: add a careers link for a startup (goes live at once), or run the
// import now ({ run: true }).
export async function POST(request) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const body = await request.json().catch(() => ({}));

  if (body.run) {
    try {
      return Response.json(await runJobsRefresh({ budgetMs: 240000, discover: 400 }));
    } catch (err) {
      console.error(err);
      return jsonError('The import failed. Check the logs.', 500);
    }
  }

  const name = typeof body.company === 'string' ? body.company.trim().slice(0, 100) : '';
  const url = typeof body.url === 'string' ? body.url.trim().slice(0, 500) : '';
  if (!name || !url) return jsonError('Add the startup name and its careers link.');
  const sql = await db();
  const [company] = await sql`SELECT id, name, country, city FROM companies WHERE lower(name) = lower(${name}) LIMIT 1`;
  if (!company) return jsonError(`No startup called “${name}” in the directory. Add it under Startups first.`);
  const result = await addCareersLink({ company, url, source: 'admin' });
  if (result.error) return jsonError(result.error);
  return Response.json({ ok: true, company: company.name, ...result });
}
