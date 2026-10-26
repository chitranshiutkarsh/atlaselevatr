import { listBuilderBoard } from '@/lib/queries';
import { BUILDER_NEEDS } from '@/lib/constants';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Public builders board: first name, city, stage, needs and headline only.
export async function GET(request) {
  const need = request.nextUrl.searchParams.get('need');
  try {
    const rows = await listBuilderBoard({ need: BUILDER_NEEDS.some(([k]) => k === need) ? need : null });
    return Response.json({ builders: rows.map((b) => ({ ...b, created_at: new Date(b.created_at).toISOString() })) });
  } catch (err) {
    console.error(err);
    return jsonError('Could not load builders', 500);
  }
}
