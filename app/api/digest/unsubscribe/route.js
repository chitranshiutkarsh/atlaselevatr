import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SITE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// One-click unsubscribe from the weekly digest (link in every email).
export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const base = SITE.url.startsWith('http://localhost') ? request.nextUrl.origin : SITE.url;
  if (token && token.length < 100) {
    try {
      const sql = await db();
      await sql`UPDATE subscriptions SET active = false WHERE unsubscribe_token = ${token}`;
    } catch (err) {
      console.error(err);
    }
  }
  return NextResponse.redirect(`${base}/me?digest=off`);
}
