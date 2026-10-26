import { db } from '@/lib/db';
import { getStats, gapCountsByCountry } from '@/lib/queries';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// The app's Atlas tab: headline numbers plus, per country, how many startups,
// unicorns, live problems, people facing them and open gaps there are.
export async function GET() {
  try {
    const sql = await db();
    const [stats, companies, problems, gaps] = await Promise.all([
      getStats(),
      sql`SELECT country, count(*)::int AS companies, count(*) FILTER (WHERE is_unicorn)::int AS unicorns
        FROM companies GROUP BY country`,
      sql`SELECT country, count(*)::int AS problems, coalesce(sum(votes), 0)::int AS votes
        FROM problems WHERE status = 'live' GROUP BY country`,
      gapCountsByCountry(),
    ]);
    const countries = {};
    const row = (name) => (countries[name] ||= { companies: 0, unicorns: 0, problems: 0, votes: 0, gaps: 0 });
    for (const c of companies) Object.assign(row(c.country), { companies: c.companies, unicorns: c.unicorns });
    for (const p of problems) Object.assign(row(p.country), { problems: p.problems, votes: p.votes });
    for (const g of gaps) row(g.country).gaps = g.gaps;
    return Response.json({ stats, countries });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load the atlas', 500);
  }
}
