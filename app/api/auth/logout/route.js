import { cookies } from 'next/headers';
import { USER_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  cookies().delete(USER_COOKIE);
  return Response.json({ ok: true });
}
