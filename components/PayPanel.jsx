'use client';

import { useEffect, useState } from 'react';
import { PLANS, UPI, inr, upiLink } from '@/lib/plans';

// Pay for Atlas+ by UPI: pick a plan, scan the QR (or tap to open a UPI app on
// a phone), then send the UPI reference so we can switch Atlas+ on.
export default function PayPanel({ email: knownEmail = '' }) {
  const [plan, setPlan] = useState('quarter');
  const [email, setEmail] = useState(knownEmail);
  const [ref, setRef] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  // The Atlas+ card's buttons link to #pay-month / #pay-quarter.
  useEffect(() => {
    const pick = () => {
      const m = window.location.hash.match(/^#pay-(month|quarter)$/);
      if (m) setPlan(m[1]);
    };
    pick();
    window.addEventListener('hashchange', pick);
    return () => window.removeEventListener('hashchange', pick);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setState('busy');
    setError('');
    try {
      const res = await fetch('/api/plus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email, ref, hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setState('sent');
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  }

  const p = PLANS[plan];

  return (
    <section id="pay" className="card relative mt-10 scroll-mt-24 overflow-hidden">
      <span id="pay-month" className="absolute -top-24" aria-hidden="true" />
      <span id="pay-quarter" className="absolute -top-24" aria-hidden="true" />
      <div className="grid md:grid-cols-[300px_1fr]">
        <div className="flex flex-col items-center justify-center gap-3 bg-[#1F2023] p-6 text-paper">
          <img src={UPI.qr} alt={`UPI QR code to pay ${UPI.name}`} width={240} height={234} className="w-60 rounded-lg" />
          <p className="text-center text-xs text-paper/70">
            Scan with any UPI app
            <br />
            <span className="font-mono text-paper/90">{UPI.id}</span>
          </p>
          <a href={upiLink(plan)} className="btn rounded-full bg-signal px-4 py-2 text-sm font-semibold text-white md:hidden">
            Pay {inr(p.price)} in a UPI app
          </a>
        </div>

        <div className="p-6">
          <p className="label">Get Atlas+ · pay by UPI</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Pay {inr(p.price)}, then tell us it&apos;s done</h2>

          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Plan">
            {Object.values(PLANS).map((x) => (
              <button
                key={x.key}
                type="button"
                role="radio"
                aria-checked={plan === x.key}
                onClick={() => setPlan(x.key)}
                className={`rounded-xl border px-4 py-2 text-left ${plan === x.key ? 'border-ink bg-ink text-paper' : 'border-ink/15 bg-white hover:border-ink/40'}`}
              >
                <span className="block font-display text-lg font-semibold">{inr(x.price)}</span>
                <span className={`block text-xs ${plan === x.key ? 'text-paper/70' : 'text-ink2'}`}>
                  {x.per}
                  {x.key === 'quarter' ? ' · best value' : ''}
                </span>
              </button>
            ))}
          </div>

          <ol className="mt-5 space-y-1 text-sm text-ink2">
            <li><span className="font-semibold text-ink">1.</span> Scan the QR and pay exactly {inr(p.price)}.</li>
            <li><span className="font-semibold text-ink">2.</span> Copy the UPI reference (UTR) from your payment app.</li>
            <li><span className="font-semibold text-ink">3.</span> Send it below. Atlas+ is switched on within a day, on this browser and your email.</li>
          </ol>

          {state === 'sent' ? (
            <p className="mt-5 rounded-lg bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">
              Thank you! We&apos;ll check the payment and switch Atlas+ on within a day.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                aria-label="Your email"
                className="input"
                maxLength={120}
                readOnly={Boolean(knownEmail)}
              />
              <input
                required
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="UPI reference / UTR no."
                aria-label="UPI reference number"
                className="input font-mono"
                maxLength={40}
              />
              <input type="text" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <button className="btn-primary justify-center" disabled={state === 'busy'}>
                {state === 'busy' ? 'Sending…' : 'I’ve paid'}
              </button>
            </form>
          )}
          {error && <p className="mt-2 text-sm text-signal">{error}</p>}
        </div>
      </div>
    </section>
  );
}
