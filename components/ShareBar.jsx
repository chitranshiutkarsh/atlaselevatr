'use client';

import { useEffect, useState } from 'react';

// Share a problem on WhatsApp, LinkedIn or X. The link carries the sharer's
// invite code, so everyone it brings in is credited to them.
export default function ShareBar({ url, title, faced, refCode }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && Boolean(navigator.share)), []);
  const link = refCode ? `${url}?ref=${refCode}` : url;
  const hook = faced > 1 ? `${faced} people face this: “${title}”. Do you?` : `“${title}”. Does this happen to you too?`;
  const text = `${hook} Add your voice on Atlas:`;
  const enc = encodeURIComponent;
  const targets = [
    ['WhatsApp', `https://wa.me/?text=${enc(`${text} ${link}`)}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`],
    ['X', `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(link)}`],
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text} ${link}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function native() {
    try {
      await navigator.share({ title, text, url: link });
    } catch {}
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="label mr-1">Rally people who face it</span>
      {targets.map(([name, href]) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="chip">
          {name}
        </a>
      ))}
      <button onClick={copy} className="chip">{copied ? 'Copied ✓' : 'Copy link'}</button>
      {canShare && (
        <button onClick={native} className="chip sm:hidden">More…</button>
      )}
      {!refCode && (
        <a href="/invite" className="text-xs text-ink2 underline hover:text-ink">Get credit for who you bring in</a>
      )}
    </div>
  );
}
