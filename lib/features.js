// Features that switch themselves on once their key is set in Vercel
// (Settings → Environment Variables), so nothing half-works in the meantime.
export function features() {
  const email = Boolean(process.env.RESEND_API_KEY);
  const admin = typeof process.env.ADMIN_PASSWORD === 'string' && process.env.ADMIN_PASSWORD.length >= 8;
  return {
    email, // sign-in, follow by email, weekly digest, "sign in to apply"
    admin, // the admin page
    plus: admin, // Atlas+ needs admin to switch it on after a UPI payment
    freeMatchLimit: admin && email, // "top 3 matches free" only once people can sign in and upgrade
  };
}
