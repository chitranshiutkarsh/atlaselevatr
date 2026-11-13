import { db } from './db';
import { emailConfigured, getUserId } from './auth';

// Atlas+ — the paid plan. Launch prices; change them here.
export const PLANS = {
  month: { key: 'month', label: 'Monthly', price: 249, months: 1, per: 'a month', env: 'ATLAS_PLUS_MONTH_LINK' },
  quarter: { key: 'quarter', label: '3 months', price: 499, months: 3, per: 'for 3 months', env: 'ATLAS_PLUS_QUARTER_LINK' },
};

// Free accounts see this many of their "For you" role matches.
export const FREE_MATCHES = 3;

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// Apply links need a free account, but only once sign-in emails can go out.
export function applyNeedsAccount() {
  return emailConfigured();
}

// The signed-in user's Atlas+ status: { signedIn, plus, until }.
export async function plusStatus() {
  const userId = getUserId();
  if (!userId) return { signedIn: false, plus: false, until: null };
  try {
    const sql = await db();
    const [row] = await sql`SELECT plus_until FROM users WHERE id = ${userId}`;
    const until = row?.plus_until ? new Date(row.plus_until) : null;
    return { signedIn: true, plus: Boolean(until && until > new Date()), until: until ? until.toISOString() : null };
  } catch {
    return { signedIn: true, plus: false, until: null };
  }
}

// Payment link for a plan (a Razorpay / Stripe payment link set in Vercel), or null.
export function paymentLink(plan) {
  const url = process.env[PLANS[plan]?.env || ''];
  return url && /^https:\/\//.test(url) ? url : null;
}
