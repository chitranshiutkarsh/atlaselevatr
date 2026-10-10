import { randomBytes } from 'crypto';
import { db } from './db';
import { SITE } from './constants';
import { CONTINENT_OF, prettyName } from './geo';
import { sendEmail, escapeHtml } from './auth';
import { refreshCoverage } from './engine';

// Weekly digest: the top unsolved problems for someone's country and
// industries, new problems this week, and the biggest gaps.

export async function saveDigest(userId, { country = null, industries = [] } = {}) {
  const sql = await db();
  const list = (industries || []).join(',') || null;
  await sql`INSERT INTO subscriptions (user_id, country, industries, active, unsubscribe_token)
    VALUES (${userId}, ${country}, ${list}, true, ${randomBytes(18).toString('base64url')})
    ON CONFLICT (user_id) DO UPDATE SET country = EXCLUDED.country, industries = EXCLUDED.industries, active = true`;
}

export async function getDigest(userId) {
  const sql = await db();
  const [row] = await sql`SELECT country, industries, active, last_sent FROM subscriptions WHERE user_id = ${userId}`;
  if (!row) return null;
  return { ...row, industries: row.industries ? row.industries.split(',') : [], last_sent: row.last_sent ? new Date(row.last_sent).toISOString() : null };
}

export async function digestContent({ country, industries }) {
  const sql = await db();
  const continent = country ? CONTINENT_OF[country] : null;
  const inds = industries && industries.length ? industries : null;
  const top = await sql`SELECT p.id, p.title, p.country, p.industry, p.votes,
      (SELECT count(*)::int FROM problem_proofs pp WHERE pp.problem_id = p.id AND pp.status = 'live') AS proofs,
      pc.local, pc.world
    FROM problems p LEFT JOIN problem_coverage pc ON pc.problem_id = p.id
    WHERE p.status = 'live'
      AND (${continent}::text IS NULL OR p.continent = ${continent})
      AND (${inds}::text[] IS NULL OR p.industry = ANY(${inds}::text[]))
    ORDER BY (p.country = ${country}) DESC, p.votes DESC, p.created_at DESC
    LIMIT 5`;
  const fresh = await sql`SELECT p.id, p.title, p.country, p.industry FROM problems p
    WHERE p.status = 'live' AND p.created_at > now() - interval '7 days'
      AND (${continent}::text IS NULL OR p.continent = ${continent})
      AND (${inds}::text[] IS NULL OR p.industry = ANY(${inds}::text[]))
    ORDER BY p.created_at DESC LIMIT 5`;
  const gaps = await sql`SELECT p.id, p.title, p.country, pc.world FROM problems p
    JOIN problem_coverage pc ON pc.problem_id = p.id
    WHERE p.status = 'live' AND pc.local = 0
      AND (${country}::text IS NULL OR p.country = ${country})
      AND (${inds}::text[] IS NULL OR p.industry = ANY(${inds}::text[]))
    ORDER BY p.votes DESC LIMIT 3`;
  return { top, fresh, gaps };
}

function section(title, rows, line) {
  if (!rows.length) return { html: '', text: '' };
  return {
    html: `<h3 style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#4A5468;margin:28px 0 8px">${title}</h3>
      <ol style="padding-left:18px;margin:0">${rows
        .map((r) => `<li style="margin:0 0 10px"><a href="${SITE.url}/problems/${r.id}" style="color:#14213D;font-weight:600">${escapeHtml(r.title)}</a><br><span style="color:#4A5468;font-size:13px">${escapeHtml(line(r))}</span></li>`)
        .join('')}</ol>`,
    text: `${title}\n${rows.map((r) => `- ${r.title} (${line(r)}) ${SITE.url}/problems/${r.id}`).join('\n')}\n`,
  };
}

export function renderDigest({ top, fresh, gaps }, { country, unsubscribeUrl }) {
  const where = country ? prettyName(country) : 'the world';
  const parts = [
    section(`Top unsolved problems near ${where}`, top, (r) => `${prettyName(r.country)} · ${r.votes} votes · ${r.proofs} face it`),
    section('New this week', fresh, (r) => `${prettyName(r.country)} · ${r.industry}`),
    section('Gaps: wanted, but no startup there yet', gaps, (r) => `${prettyName(r.country)} · ${r.world} startups elsewhere`),
  ];
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#14213D;max-width:560px">
    <p style="font-family:Georgia,serif;font-size:24px;font-weight:600;margin:0">Your weekly Atlas</p>
    <p style="color:#4A5468">The problems people near ${escapeHtml(where)} want solved, and where no one is building yet.</p>
    ${parts.map((p) => p.html).join('')}
    <p style="margin-top:28px"><a href="${SITE.url}/gaps" style="display:inline-block;background:#14213D;color:#F4F1EA;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">See all gaps →</a></p>
    <p style="color:#4A5468;font-size:12px;margin-top:28px">You get this because you signed up on ${SITE.domain}. <a href="${unsubscribeUrl}" style="color:#4A5468">Unsubscribe</a>.</p>
  </div>`;
  const text = `Your weekly Atlas\n\n${parts.map((p) => p.text).join('\n')}\nAll gaps: ${SITE.url}/gaps\nUnsubscribe: ${unsubscribeUrl}\n`;
  return { html, text, empty: !top.length && !fresh.length && !gaps.length };
}

// Sends the digest to everyone due one (not sent in the last 6 days).
export async function sendDueDigests({ max = 200 } = {}) {
  const sql = await db();
  await refreshCoverage({ max: 30 });
  const due = await sql`SELECT s.user_id, s.country, s.industries, s.unsubscribe_token, u.email
    FROM subscriptions s JOIN users u ON u.id = s.user_id
    WHERE s.active AND (s.last_sent IS NULL OR s.last_sent < now() - interval '6 days')
    ORDER BY s.last_sent ASC NULLS FIRST
    LIMIT ${max}`;
  let sent = 0;
  const failed = [];
  for (const s of due) {
    try {
      const prefs = { country: s.country, industries: s.industries ? s.industries.split(',') : [] };
      const content = await digestContent(prefs);
      const mail = renderDigest(content, {
        country: s.country,
        unsubscribeUrl: `${SITE.url}/api/digest/unsubscribe?token=${encodeURIComponent(s.unsubscribe_token)}`,
      });
      if (!mail.empty) {
        await sendEmail({ to: s.email, subject: 'Your weekly Atlas: problems worth solving', html: mail.html, text: mail.text });
        sent++;
      }
      await sql`UPDATE subscriptions SET last_sent = now() WHERE user_id = ${s.user_id}`;
    } catch (err) {
      console.error('digest failed for user', s.user_id, err);
      failed.push(s.user_id);
    }
  }
  return { due: due.length, sent, failed: failed.length };
}
