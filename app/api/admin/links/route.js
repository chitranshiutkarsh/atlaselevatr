import { db } from '@/lib/db';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Admin: review a problem→startup link. 'block' hides it from jobs, 'confirm'
// keeps it whatever its score, 'clear' goes back to the automatic decision.
export async function POST(request) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const body = await request.json().catch(() => ({}));
  const problemId = parseInt(body.problem_id, 10);
  const companyId = parseInt(body.company_id, 10);
  const verdict = ['block', 'confirm', 'clear'].includes(body.verdict) ? body.verdict : null;
  if (!problemId || !companyId || !verdict) return jsonError('Invalid request');
  const sql = await db();
  if (verdict === 'clear') {
    await sql`DELETE FROM link_reviews WHERE problem_id = ${problemId} AND company_id = ${companyId}`;
  } else {
    await sql`INSERT INTO link_reviews (problem_id, company_id, verdict, note)
      VALUES (${problemId}, ${companyId}, ${verdict}, 'admin')
      ON CONFLICT (problem_id, company_id) DO UPDATE SET verdict = EXCLUDED.verdict, note = EXCLUDED.note, created_at = now()`;
  }
  return Response.json({ ok: true });
}
