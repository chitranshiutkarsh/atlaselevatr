'use client';

import { useState } from 'react';

// An organisation's official logo (from its own file or Wikimedia), or its name
// in a neat tile when no official logo file is available.
// Tiles are wide so wordmark logos (Nykaa, INSEAD, SPJIMR) stay readable.
export default function OrgLogo({ src, name, size = 40, wide }) {
  const [failed, setFailed] = useState(!src);
  // Square logo files (from LinkedIn) get square tiles; wordmarks get wide ones.
  const ratio = wide ?? (src && src.startsWith('/logos/') ? 1 : 2.4);
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-white"
      style={{ width: Math.round(size * ratio), height: size }}
      title={name}
    >
      {failed ? (
        <span className="px-1.5 text-center font-display text-[11px] font-semibold leading-tight text-ink">{name.replace(/\s*\(.*\)/, '')}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={`h-full w-full object-contain ${src && src.startsWith('/logos/') ? '' : 'p-1'}`}
        />
      )}
    </span>
  );
}
