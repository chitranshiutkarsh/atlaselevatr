import { listGaps } from '@/lib/queries';
import { gapVerdict } from '@/lib/engine';
import { INDUSTRIES, problemStage } from '@/lib/constants';
import { CONTINENT_OF, CONTINENTS, prettyName } from '@/lib/geo';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Problems ranked by unmet demand (the "Gaps" tab in the app).
export async function GET(request) {
  const p = request.nextUrl.searchParams;
  const continent = p.get('continent');
  const country = p.get('country');
  const industry = p.get('industry');
  try {
    const rows = await listGaps({
      continent: CONTINENTS.some((c) => c.name === continent) ? continent : null,
      country: country && CONTINENT_OF[country] ? country : null,
      industry: INDUSTRIES.includes(industry) ? industry : null,
      q: (p.get('q') || '').trim().slice(0, 80) || null,
      limit: Math.min(Math.max(parseInt(p.get('limit'), 10) || 60, 1), 100),
    });
    return Response.json({
      problems: rows.map((r) => ({
        ...r,
        created_at: new Date(r.created_at).toISOString(),
        stage: problemStage(r),
        verdict: gapVerdict({ world: r.world, local: r.local }, prettyName(r.country)),
      })),
    });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load gaps', 500);
  }
}
