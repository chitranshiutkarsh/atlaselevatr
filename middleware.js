import { NextResponse } from 'next/server';

const YEAR = 60 * 60 * 24 * 365;

export function middleware(request) {
  const response = NextResponse.next();
  const secure = request.nextUrl.protocol === 'https:';

  if (!request.cookies.get('av_vid')) {
    response.cookies.set('av_vid', crypto.randomUUID(), {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: YEAR,
    });
  }

  // ?ref=CODE also counts as an invite (first referrer wins).
  const ref = (request.nextUrl.searchParams.get('ref') || '').toUpperCase();
  if (/^[A-Z2-9]{6}$/.test(ref) && !request.cookies.get('av_ref')) {
    response.cookies.set('av_ref', ref, { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 24 * 30 });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|txt|xml)$).*)'],
};
