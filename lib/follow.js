import crypto from 'crypto';
import { db } from './db';
import { emailConfigured, sendEmail, escapeHtml, validEmail } from './auth';
import { SITE } from './constants';

// "Email me when someone builds this": people follow a problem by email and
// hear when someone claims it or suggests a solution.

export async function followProblem(problemId, email, ip = null) {
  const clean = String(email || '').trim().toLowerCase();
  if (!validEmail(clean)) return { error: 'Enter a valid email.' };
  const sql = await db();
  if (ip) {
    const [{ recent }] = await sql`SELECT count(*)::int AS recent FROM problem_follows
      WHERE ip_hash = ${ip} AND created_at > now() - interval '1 hour'`;
    if (recent >= 20) return { error: 'Too many from this network. Try again later.' };
  }
  const token = crypto.randomBytes(18).toString('hex');
  await sql`INSERT INTO problem_follows (problem_id, email, token, ip_hash)
    VALUES (${problemId}, ${clean}, ${token}, ${ip})
    ON CONFLICT (problem_id, lower(email)) DO UPDATE SET active = true`;
  return { ok: true };
}

const EVENTS = {
  claim: (p, d) => ({
    subject: `Someone wants to build “${p.title}”`,
    line: `${d.name || 'A builder'} just claimed this problem on Atlas${d.stage ? ` (${d.stage})` : ''}.`,
  }),
  solution: (p, d) => ({
    subject: `New idea for “${p.title}”`,
    line: `${d.author || 'Someone'} suggested a way to solve it: “${String(d.body || '').slice(0, 220)}”`,
  }),
};

// Fire-and-forget: never let email trouble break the action that triggered it.
export async function notifyFollowers(problemId, event, detail = {}) {
  try {
    if (!emailConfigured() || !EVENTS[event]) return;
    const sql = await db();
    const [problem] = await sql`SELECT id, title FROM problems WHERE id = ${problemId} AND status = 'live'`;
    if (!problem) return;
    const followers = await sql`SELECT email, token FROM problem_follows
      WHERE problem_id = ${problemId} AND active LIMIT 200`;
    const { subject, line } = EVENTS[event](problem, detail);
    const url = `${SITE.url}/problems/${problem.id}`;
    await Promise.allSettled(
      followers
        .filter((f) => f.email !== String(detail.email || '').toLowerCase())
        .map((f) => {
          const stop = `${SITE.url}/api/follow/unsubscribe?token=${f.token}`;
          return sendEmail({
            to: f.email,
            subject,
            text: `${line}\n\nSee it: ${url}\n\nStop updates for this problem: ${stop}`,
            html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;color:#14213D">
              <p style="font-size:16px">${escapeHtml(line)}</p>
              <p><a href="${url}" style="display:inline-block;background:#E4572E;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">See the problem</a></p>
              <p style="font-size:12px;color:#5C6478">You follow “${escapeHtml(problem.title)}” on Atlas. <a href="${stop}" style="color:#5C6478">Stop these updates</a>.</p>
            </div>`,
          });
        })
    );
  } catch (err) {
    console.error('notify followers failed', err);
  }
}
