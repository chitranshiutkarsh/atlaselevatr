import { runJobsRefresh } from '@/lib/careers';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Keeps jobs fresh between the daily cron runs. The jobs page pings this in
// the background; it does real work at most once every 10 minutes, and only
// one run happens at a time, so calling it often is harmless.
async function handle() {
  try {
    return Response.json(await runJobsRefresh({ budgetMs: 35000, minGapMinutes: 10, discover: 60 }));
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Refresh failed' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
