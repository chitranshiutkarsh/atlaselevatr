import { runJobsRefresh } from '@/lib/careers';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Daily (see vercel.json): refresh every verified careers board, so closed roles
// drop off and new ones appear. Every 4th day it also runs a deep sweep that looks
// for careers pages at many more startups, which is what adds new jobs in bulk.
// Vercel sends "Authorization: Bearer <CRON_SECRET>".
const SWEEP_EVERY_DAYS = 4;
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Not allowed' }, { status: 401 });
  }
  try {
    const sweep = Math.floor(Date.now() / 86400000) % SWEEP_EVERY_DAYS === 0;
    const result = await runJobsRefresh(
      sweep ? { budgetMs: 285000, discover: 2000, matchMax: 400 } : { budgetMs: 270000, discover: 600, matchMax: 200 }
    );
    return Response.json({ sweep, ...result });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Jobs run failed' }, { status: 500 });
  }
}
