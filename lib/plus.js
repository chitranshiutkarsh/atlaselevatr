import { db } from './db';
import { emailConfigured, getUserId } from './auth';
import { getVisitorId } from './security';

export { PLANS, FREE_MATCHES, inr, UPI, upiLink } from './plans';

// Apply links need a free account, but only once sign-in emails can go out.
export function applyNeedsAccount() {
  return emailConfigured();
}

// Atlas+ status for this visitor: { signedIn, plus, until }. Atlas+ follows the
// account, and also the browser someone paid from (sign-in is optional).
export async function plusStatus() {
  const userId = getUserId();
  const visitorId = getVisitorId();
  try {
    const sql = await db();
    const [row] = await sql`SELECT greatest(
        (SELECT plus_until FROM users WHERE id = ${userId}::int),
        (SELECT max(plus_until) FROM plus_requests WHERE status = 'active' AND visitor_id = ${visitorId}::text)
      ) AS until`;
    const until = row?.until ? new Date(row.until) : null;
    return { signedIn: Boolean(userId), plus: Boolean(until && until > new Date()), until: until ? until.toISOString() : null };
  } catch {
    return { signedIn: Boolean(userId), plus: false, until: null };
  }
}
