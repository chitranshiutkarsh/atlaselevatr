import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';
import { SITE } from './constants';

// Light sign-in: email magic links, no passwords. A signed cookie holds the
// user id. Email is sent through Resend when RESEND_API_KEY is set.

export const USER_COOKIE = 'av_uid';
const LINK_MINUTES = 30;
const SESSION_DAYS = 90;

function secret() {
  return process.env.HASH_SECRET || process.env.ADMIN_PASSWORD || 'atlas-dev-secret';
}

function sign(value) {
  return createHmac('sha256', secret()).update(`atlas-user-v1:${value}`).digest('hex').slice(0, 32);
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function validEmail(email) {
  return typeof email === 'string' && email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function hashToken(token) {
  return createHash('sha256').update(`${secret()}:${token}`).digest('hex');
}

export function newToken() {
  return randomBytes(24).toString('base64url');
}

// Signed-in user id from the cookie, or null.
export function getUserId() {
  const raw = cookies().get(USER_COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split('.');
  if (!/^\d+$/.test(id || '') || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(id));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Number(id);
}

export async function getUser() {
  const id = getUserId();
  if (!id) return null;
  const sql = await db();
  const [user] = await sql`SELECT id, email, name, created_at FROM users WHERE id = ${id}`;
  return user || null;
}

export function sessionCookie(userId) {
  return {
    name: USER_COOKIE,
    value: `${userId}.${sign(String(userId))}`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * SESSION_DAYS,
    },
  };
}

export async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured()) throw new Error('Email is not set up');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `Atlas <hello@${SITE.domain}>`,
      to: [to],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Email failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Creates a one-time sign-in link and emails it. `digest` (optional) holds
// weekly-digest preferences to save once the link is opened.
export async function sendMagicLink({ email, nextPath = '/me', digest = null, ip = null }) {
  const sql = await db();
  const token = newToken();
  const safeNext = typeof nextPath === 'string' && /^\/[A-Za-z0-9/_\-?=&%.#]*$/.test(nextPath) ? nextPath : '/me';
  await sql`INSERT INTO login_tokens (token_hash, email, next_path, digest, ip_hash, expires_at)
    VALUES (${hashToken(token)}, ${email}, ${safeNext}, ${digest ? JSON.stringify(digest) : null}::jsonb, ${ip},
            now() + make_interval(mins => ${LINK_MINUTES}))`;
  const link = `${SITE.url}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const intro = digest
    ? 'Confirm your weekly Atlas digest and sign in.'
    : 'Sign in to Atlas.';
  await sendEmail({
    to: email,
    subject: digest ? 'Confirm your weekly Atlas digest' : 'Your Atlas sign-in link',
    text: `${intro}\n\n${link}\n\nThe link works once and expires in ${LINK_MINUTES} minutes. If you did not ask for it, ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#14213D">
      <p>${intro}</p>
      <p><a href="${link}" style="display:inline-block;background:#14213D;color:#F4F1EA;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">${digest ? 'Confirm and sign in' : 'Sign in to Atlas'}</a></p>
      <p style="color:#4A5468;font-size:13px">The link works once and expires in ${LINK_MINUTES} minutes. If you did not ask for it, ignore this email.</p>
    </div>`,
  });
}
