import { clearAdminSession } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST() {
  clearAdminSession();
  return Response.json({ ok: true });
}
