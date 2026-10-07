import { db } from '@/lib/db';
import { JOB_SOURCES, MAX_ACTIVE_JOBS } from '@/lib/constants';
import { isAdmin, jsonError } from '@/lib/security';
import { cleanJob } from './validate';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid request');
  }
  const job = cleanJob(body, JOB_SOURCES);
  if (job.error) return jsonError(job.error);

  const sql = await db();
  const [{ active }] = await sql`SELECT count(*)::int AS active FROM jobs WHERE active = true`;
  if (active >= MAX_ACTIVE_JOBS) {
    return jsonError(`The board already has ${MAX_ACTIVE_JOBS} live jobs. Remove or pause one first.`, 409);
  }
  const [row] = await sql`INSERT INTO jobs (title, company, location, source, url, focus)
    VALUES (${job.title}, ${job.company}, ${job.location}, ${job.source}, ${job.url}, ${job.focus})
    RETURNING *`;
  return Response.json({ job: row }, { status: 201 });
}
