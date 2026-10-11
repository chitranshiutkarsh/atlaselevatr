import { db } from '@/lib/db';
import { SITE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token') || '';
  let problemId = null;
  if (/^[a-f0-9]{20,64}$/.test(token)) {
    try {
      const sql = await db();
      const rows = await sql`UPDATE problem_follows SET active = false WHERE token = ${token} RETURNING problem_id`;
      problemId = rows[0]?.problem_id || null;
    } catch (err) {
      console.error(err);
    }
  }
  return Response.redirect(`${SITE.url}${problemId ? `/problems/${problemId}?follow=off` : '/'}`, 302);
}
