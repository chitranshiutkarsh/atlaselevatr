import { createHash, createHmac, timingSafeEqual, randomBytes, randomUUID } from 'crypto';
import { cookies, headers } from 'next/headers';

export const VISITOR_COOKIE = 'av_vid';
export const REF_COOKIE = 'av_ref';
export const ADMIN_COOKIE = 'av_admin';

const YEAR = 60 * 60 * 24 * 365;

function secret() {
  return process.env.HASH_SECRET || process.env.ADMIN_PASSWORD || 'atlas-dev-secret';
}

// IP addresses are never stored, only a salted hash used for rate limiting.
export function ipHash() {
  const h = headers();
  const raw = (h.get('x-forwarded-for') || h.get('x-real-ip') || 'unknown').split(',')[0].trim();
  return createHash('sha256').update(`${secret()}:${raw}`).digest('hex').slice(0, 32);
}

// Anonymous visitor id kept in a cookie (set by middleware). Used for one
// vote per person and to find someone's own invite code without a login.
export function getVisitorId({ create = false } = {}) {
  const jar = cookies();
  let id = jar.get(VISITOR_COOKIE)?.value;
  if (id && /^[a-f0-9-]{36}$/.test(id)) return id;
  if (!create) return null;
  id = randomUUID();
  jar.set(VISITOR_COOKIE, id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: YEAR });
  return id;
}

export function getRefCode() {
  const ref = cookies().get(REF_COOKIE)?.value;
  return ref && /^[A-Z2-9]{6}$/.test(ref) ? ref : null;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newInviteCode() {
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}

function adminToken() {
  return createHmac('sha256', process.env.ADMIN_PASSWORD || '').update('atlas-admin-v1').digest('hex');
}

export function adminConfigured() {
  return typeof process.env.ADMIN_PASSWORD === 'string' && process.env.ADMIN_PASSWORD.length >= 8;
}

export function checkAdminPassword(password) {
  if (!adminConfigured() || typeof password !== 'string') return false;
  const a = createHash('sha256').update(password).digest();
  const b = createHash('sha256').update(process.env.ADMIN_PASSWORD).digest();
  return timingSafeEqual(a, b);
}

export function setAdminSession() {
  cookies().set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}

export function isAdmin() {
  if (!adminConfigured()) return false;
  const value = cookies().get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(adminToken());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}
