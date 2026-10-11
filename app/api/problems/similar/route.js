import { similarProblems } from '@/lib/queries';
import { jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

// Used by "Add a problem" to show problems that may already be on Atlas.
export async function GET(request) {
  const q = (request.nextUrl.searchParams.get('q') || '').slice(0, 300);
  try {
    return Response.json({ problems: await similarProblems(q) });
  } catch (err) {
    console.error(err);
    return jsonError('Could not search', 500);
  }
}
