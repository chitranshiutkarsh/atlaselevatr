import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SITE } from '@/lib/constants';
import { hashToken, sessionCookie } from '@/lib/auth';
import { saveDigest } from '@/lib/digest';

export const dynamic = 'force-dynamic';

// Opens a magic link: signs the person in (creating their account on first
// use), links their earlier anonymous activity, and confirms any digest.
export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const base = SITE.url.startsWith('http://localhost') ? request.nextUrl.origin : SITE.url;
  if (!token || token.length > 100) return NextResponse.redirect(`${base}/signin?error=invalid`);

  try {
    const sql = await db();
    const [row] = await sql`UPDATE login_tokens SET used = true
      WHERE token_hash = ${hashToken(token)} AND NOT used AND expires_at > now()
      RETURNING email, next_path, digest`;
    if (!row) return NextResponse.redirect(`${base}/signin?error=expired`);

    const [user] = await sql`INSERT INTO users (email, last_login) VALUES (${row.email}, now())
      ON CONFLICT (email) DO UPDATE SET last_login = now()
      RETURNING id`;

    // Credit activity from this browser to the account.
    const visitor = request.cookies.get('av_vid')?.value;
    if (visitor && /^[a-f0-9-]{36}$/.test(visitor)) {
      await sql`UPDATE problem_proofs SET user_id = ${user.id} WHERE visitor_id = ${visitor} AND user_id IS NULL`;
      await sql`UPDATE votes SET user_id = ${user.id} WHERE visitor_id = ${visitor} AND user_id IS NULL`;
    }
    await sql`UPDATE builder_interests SET user_id = ${user.id} WHERE lower(email) = lower(${row.email}) AND user_id IS NULL`;

    let next = row.next_path || '/me';
    if (row.digest) {
      await saveDigest(user.id, row.digest);
      next = '/me?digest=on';
    }
    const res = NextResponse.redirect(`${base}${next}`);
    const c = sessionCookie(user.id);
    res.cookies.set(c.name, c.value, c.options);
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(`${base}/signin?error=failed`);
  }
}
