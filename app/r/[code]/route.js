import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Share links look like atlaselevatr.in/r/ABC123. A visit is counted for the
// code's owner and the code is remembered so later actions credit them.
export async function GET(request, { params }) {
  const code = String(params.code || '').toUpperCase();
  const response = NextResponse.redirect(new URL('/', request.url));
  if (!/^[A-Z2-9]{6}$/.test(code)) return response;

  try {
    const sql = await db();
    const rows = await sql`UPDATE invites SET visits = visits + 1 WHERE code = ${code} RETURNING code`;
    if (rows.length && !request.cookies.get('av_ref')) {
      response.cookies.set('av_ref', code, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch (err) {
    console.error(err);
  }
  return response;
}
