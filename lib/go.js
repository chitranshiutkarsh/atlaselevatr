import { NextResponse } from 'next/server';
import { db } from './db';
import { getUserId } from './auth';
import { applyNeedsAccount } from './plus';

// Apply links go through Atlas: a free account opens them (like the map's
// "sign in to apply"), then we send the person on to the company's own page.
export async function goTo(request, kind, rawId) {
  const id = parseInt(rawId, 10);
  const home = new URL(kind === 'role' ? '/jobs' : '/jobs', request.url);
  if (!id) return NextResponse.redirect(home);
  if (applyNeedsAccount() && !getUserId()) {
    const next = `/go/${kind}/${id}`;
    return NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(next)}&why=apply`, request.url));
  }
  try {
    const sql = await db();
    const [row] = kind === 'role'
      ? await sql`SELECT url FROM roles WHERE id = ${id}`
      : await sql`SELECT url FROM jobs WHERE id = ${id}`;
    if (row?.url && /^https?:\/\//.test(row.url)) return NextResponse.redirect(row.url);
  } catch (err) {
    console.error(err);
  }
  return NextResponse.redirect(home);
}
