'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUILDER_STAGES, BUILDER_COMMITMENT, BUILDER_NEEDS, SITE } from '@/lib/constants';

const EMPTY = { name: '', email: '', phone: '', linkedin: '', city: '', stage: '', commitment: '', needs: [], pitch: '', headline: '', is_public: true, hp: '' };

// "Want to build this?" call to action and form on a problem page.
export default function BuildInterest({ problemId, problemTitle, initialCount }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [f, setF] = useState(EMPTY);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const started = useRef(0);
  const box = useRef(null);

  useEffect(() => {
    if (window.location.hash === '#build') {
      setOpen(true);
      setTimeout(() => box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, []);
  useEffect(() => {
    if (open) started.current = Date.now();
  }, [open]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const toggleNeed = (k) =>
    setF((x) => ({ ...x, needs: x.needs.includes(k) ? x.needs.filter((n) => n !== k) : [...x.needs, k] }));

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch(`/api/problems/${problemId}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, t: started.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setCount(data.builders);
      setStatus({ state: 'done', message: '', isPublic: data.is_public });
      if (data.is_public) router.refresh();
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  return (
    <section id="build" ref={box} className="mt-10 scroll-mt-24 overflow-hidden rounded-xl border-2 border-ink bg-ink text-paper">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/60">{SITE.parent} venture studio</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Want to build this?</h2>
          <p className="mt-1 max-w-lg text-sm text-paper/75">
            Turn this problem into a company. {SITE.parent} helps founders go from idea to product-market fit, scale and
            a Series A.
          </p>
          {count > 0 && (
            <p className="mt-2 text-sm font-semibold text-[#F4A27F]">
              🚀 {count} {count === 1 ? 'person wants' : 'people want'} to build this
            </p>
          )}
        </div>
        {!open && status.state !== 'done' && (
          <button onClick={() => setOpen(true)} className="btn shrink-0 bg-signal text-white hover:bg-paper hover:text-ink">
            I want to build this →
          </button>
        )}
      </div>

      {status.state === 'done' ? (
        <div className="border-t border-paper/15 bg-paper p-6 text-ink">
          <p className="label text-moss">You&apos;re on the list</p>
          <p className="mt-2 font-display text-2xl font-semibold">Thanks, {f.name.split(' ')[0]}. The studio team will reach out.</p>
          <p className="mt-2 text-sm text-ink2">
            We review every builder for “{problemTitle}”. Meanwhile, share this problem to rally votes and potential co-founders.
          </p>
          {status.isPublic && (
            <p className="mt-2 text-sm text-ink2">
              Your builder card is live below. Post progress updates on it from this browser to show the studio and
              possible co-founders you&apos;re moving.
            </p>
          )}
        </div>
      ) : (
        open && (
          <form onSubmit={submit} className="space-y-4 border-t border-paper/15 bg-paper p-6 text-ink">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="b-name">Name *</label>
                <input id="b-name" className="input mt-1.5" value={f.name} onChange={set('name')} maxLength={80} required />
              </div>
              <div>
                <label className="label" htmlFor="b-email">Email *</label>
                <input id="b-email" type="email" className="input mt-1.5" value={f.email} onChange={set('email')} maxLength={120} required />
              </div>
              <div>
                <label className="label" htmlFor="b-phone">Phone / WhatsApp</label>
                <input id="b-phone" className="input mt-1.5" value={f.phone} onChange={set('phone')} maxLength={30} placeholder="+91…" />
              </div>
              <div>
                <label className="label" htmlFor="b-li">LinkedIn</label>
                <input id="b-li" className="input mt-1.5" value={f.linkedin} onChange={set('linkedin')} maxLength={200} placeholder="linkedin.com/in/…" />
              </div>
              <div>
                <label className="label" htmlFor="b-stage">Where are you with it? *</label>
                <select id="b-stage" className="input mt-1.5" value={f.stage} onChange={set('stage')} required>
                  <option value="" disabled>Choose one</option>
                  {BUILDER_STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="b-commit">Time you can give it *</label>
                <select id="b-commit" className="input mt-1.5" value={f.commitment} onChange={set('commitment')} required>
                  <option value="" disabled>Choose one</option>
                  {BUILDER_COMMITMENT.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <p className="label">What do you need help with?</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BUILDER_NEEDS.map(([k, l]) => (
                  <button type="button" key={k} onClick={() => toggleNeed(k)} className={f.needs.includes(k) ? 'chip-on' : 'chip'}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="b-pitch">Why you, and how would you approach it?</label>
              <textarea
                id="b-pitch"
                rows={4}
                className="input mt-1.5"
                value={f.pitch}
                onChange={set('pitch')}
                maxLength={1500}
                placeholder="Your background, unfair advantage, first idea for a solution…"
              />
            </div>
            <div className="rounded-lg border border-ink/10 bg-paper2/50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#E4572E]"
                  checked={f.is_public}
                  onChange={(e) => setF((x) => ({ ...x, is_public: e.target.checked }))}
                />
                <span>
                  <span className="font-semibold">Claim this problem publicly</span>
                  <span className="block text-sm text-ink2">
                    Show a builder card on this problem and on the Builders board: your first name, city, stage and what
                    you need (e.g. a co-founder). Your email, phone and LinkedIn are never shown. People who want to join
                    you ask the {SITE.parent} team for an intro.
                  </span>
                </span>
              </label>
              {f.is_public && (
                <input
                  className="input mt-3"
                  value={f.headline}
                  onChange={set('headline')}
                  maxLength={140}
                  placeholder="One-line headline for your card, e.g. “Ex-Swiggy PM building cold-chain lockers for kiranas”"
                />
              )}
            </div>
            <div>
              <label className="label" htmlFor="b-city">City</label>
              <input id="b-city" className="input mt-1.5 sm:max-w-xs" value={f.city} onChange={set('city')} maxLength={60} />
            </div>
            <div className="hidden" aria-hidden="true">
              <input tabIndex={-1} autoComplete="off" value={f.hp} onChange={set('hp')} />
            </div>
            {status.state === 'error' && <p className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal">{status.message}</p>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink2">Only the {SITE.parent} team sees your contact details.</p>
              <button className="btn-primary" disabled={status.state === 'busy'}>
                {status.state === 'busy' ? 'Sending…' : 'Count me in'}
              </button>
            </div>
          </form>
        )
      )}
    </section>
  );
}
