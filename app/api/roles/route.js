import { listRoles } from '@/lib/roles';
import { CONTINENT_OF } from '@/lib/geo';
import { INDIA_CITIES } from '@/lib/india-cities';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Open roles for the map: one startup's roles (?company=ID), or a country /
// Indian city's roles (?country=India&city=Bengaluru). Apply goes via /go/role/ID.
export async function GET(request) {
  const p = request.nextUrl.searchParams;
  const companyId = parseInt(p.get('company') || '', 10) || null;
  const country = CONTINENT_OF[p.get('country')] ? p.get('country') : null;
  const city = INDIA_CITIES[p.get('city')] ? p.get('city') : null;
  if (!companyId && !country && !city) return jsonError('Pick a startup or a place.');
  const limit = Math.min(Math.max(parseInt(p.get('limit') || '8', 10) || 8, 1), 50);
  try {
    const { roles, total } = await listRoles({ companyId, country: city ? null : country, city, limit });
    return Response.json(
      {
        total,
        roles: roles.map((r) => ({
          id: r.id,
          title: r.title,
          company: r.company_name || r.company || null,
          location: r.location,
          remote: r.remote,
          kind: r.kind,
          posted_at: r.posted_at,
          apply: `/go/role/${r.id}`,
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } }
    );
  } catch (err) {
    console.error(err);
    return jsonError('Could not load roles', 500);
  }
}
