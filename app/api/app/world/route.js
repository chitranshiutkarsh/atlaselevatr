// World map outlines for the app's Atlas tab (the same file the website map
// uses). Served from atlaselevatr.in so the app never calls a third party,
// and cached at the edge for a year.
const SOURCE = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Built per request (not at deploy time) so a slow source never breaks a
// deploy; Vercel's edge cache serves it after the first request.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(SOURCE, { cache: 'no-store' });
    if (!res.ok) throw new Error(`map source returned ${res.status}`);
    const body = await res.text();
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Map unavailable' }, { status: 502 });
  }
}
