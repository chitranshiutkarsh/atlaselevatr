import { listCompanies } from '@/lib/queries';
import { INDUSTRIES, DIRECTORY_PAGE_SIZE } from '@/lib/constants';
import { CONTINENT_OF, CONTINENTS } from '@/lib/geo';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const p = request.nextUrl.searchParams;
  const country = p.get('country');
  const continent = p.get('continent');
  const industry = p.get('industry');
  const city = (p.get('city') || '').slice(0, 60) || null;
  const q = (p.get('q') || '').trim().slice(0, 80) || null;
  try {
    const data = await listCompanies({
      country: country && CONTINENT_OF[country] ? country : null,
      continent: CONTINENTS.some((c) => c.name === continent) ? continent : null,
      industry: INDUSTRIES.includes(industry) ? industry : null,
      city,
      q,
      unicorn: p.get('unicorn') === '1',
      limit: p.get('limit') || DIRECTORY_PAGE_SIZE,
      offset: p.get('offset') || 0,
    });
    return Response.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load startups', 500);
  }
}
