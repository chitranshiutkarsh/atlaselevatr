// Atlas+ plans and how to pay. Plain constants, safe to use in the browser.
export const PLANS = {
  month: { key: 'month', label: '1 month', price: 99, months: 1, per: 'a month' },
  quarter: { key: 'quarter', label: '3 months', price: 250, months: 3, per: 'for 3 months' },
};

// Free accounts see this many of their "For you" role matches.
export const FREE_MATCHES = 3;

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// UPI details from the payment QR (public/pay/upi-qr.jpg).
export const UPI = {
  id: 'chitranshiutkarsh1-1@okhdfcbank',
  name: 'Utkarsh Chitranshi',
  qr: '/pay/upi-qr.jpg',
};

// Opens any UPI app with the amount filled in (phones only).
export function upiLink(plan) {
  const p = PLANS[plan];
  const params = new URLSearchParams({ pa: UPI.id, pn: UPI.name, am: String(p.price), cu: 'INR', tn: `Atlas+ ${p.label}` });
  return `upi://pay?${params.toString()}`;
}
