import { listJobs } from '@/lib/queries';
import { INDUSTRIES } from '@/lib/constants';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Curated problem-solving jobs (the app's Jobs tab).
export async function GET(request) {
  const industry = request.nextUrl.searchParams.get('industry');
  try {
    const jobs = await listJobs({ industry: INDUSTRIES.includes(industry) ? industry : null });
    return Response.json({ jobs: jobs.map((j) => ({ ...j, created_at: new Date(j.created_at).toISOString() })) });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load jobs', 500);
  }
}
