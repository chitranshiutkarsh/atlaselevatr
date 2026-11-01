'use client';

import { useState } from 'react';

// An organisation's official logo (from its own file or Wikimedia), or its initials
// in a neat tile when no official logo file is available.
export default function OrgLogo({ src, name, size = 40 }) {
  const [failed, setFailed] = useState(!src);
  const initials = name
    .replace(/[()]/g, '')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 ${failed ? 'bg-ink' : 'bg-white'}`}
      style={{ width: size, height: size }}
      title={name}
    >
      {failed ? (
        <span className="font-display text-xs font-semibold tracking-wide text-paper">{initials}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1"
        />
      )}
    </span>
  );
}
