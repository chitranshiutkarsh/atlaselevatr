'use client';

import { useState } from 'react';

// Company / school logo from its website's icon, falling back to initials.
export default function OrgLogo({ domain, name, size = 40 }) {
  const [failed, setFailed] = useState(!domain);
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-white"
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span className="font-display text-sm font-semibold text-ink">{initials}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt={`${name} logo`}
          width={size - 12}
          height={size - 12}
          loading="lazy"
          onError={() => setFailed(true)}
          className="object-contain"
          style={{ width: size - 12, height: size - 12 }}
        />
      )}
    </span>
  );
}
