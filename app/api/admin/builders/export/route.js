import { db } from '@/lib/db';
import { isAdmin, jsonError } from '@/lib/security';

export const dynamic = 'force-dynamic';

function cell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  // Quote every cell; neutralise spreadsheet formulas.
  const safe = /^(=|@|[+\-](?![\d\s]))/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

// CSV of all "Want to build this?" leads, for the studio team.
export async function GET() {
  if (!isAdmin()) return jsonError('Not signed in', 401);
  const sql = await db();
  const rows = await sql`SELECT b.created_at, b.status, b.name, b.email, b.phone, b.linkedin, b.city, b.stage,
      b.commitment, b.needs, b.pitch, b.notes, b.referred_by, p.title AS problem, p.country, p.industry, p.votes
    FROM builder_interests b JOIN problems p ON p.id = b.problem_id
    ORDER BY b.created_at DESC`;
  const cols = ['created_at', 'status', 'name', 'email', 'phone', 'linkedin', 'city', 'stage', 'commitment', 'needs',
    'pitch', 'notes', 'referred_by', 'problem', 'country', 'industry', 'votes'];
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => cell(c === 'created_at' ? new Date(r[c]).toISOString() : r[c])).join(','))].join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="atlas-builder-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
