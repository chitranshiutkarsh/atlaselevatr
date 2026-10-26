import { runJobsRefresh } from '@/lib/careers';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Daily (see vercel.json): refresh every verified careers board and look for
// boards at more startups. Vercel sends "Authorization: Bearer <CRON_SECRET>".
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Not allowed' }, { status: 401 });
  }
  try {
    return Response.json(await runJobsRefresh({ budgetMs: 270000, discover: 600, matchMax: 200 }));
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Jobs run failed' }, { status: 500 });
  }
}
