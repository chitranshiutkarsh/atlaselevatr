'use client';

import { useEffect, useState } from 'react';

function ago(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return 'today';
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// Open roles right on the map: one startup's, or one city's. Apply opens the
// company's own page (via /go/role/ID) without leaving Atlas.
export default function InlineRoles({ query, limit = 8, showCompany = false, dark = false, moreHref = null }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);
    fetch(`/api/roles?${query}&limit=${limit}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [query, limit]);

  const muted = dark ? 'text-paper/70' : 'text-ink2';
  if (error) return <p className={`mt-2 text-xs ${muted}`}>Couldn&apos;t load roles. Try again in a moment.</p>;
  if (!data) return <p className={`mt-2 text-xs ${muted}`}>Loading roles…</p>;
  if (data.roles.length === 0) return <p className={`mt-2 text-xs ${muted}`}>No open roles right now.</p>;

  return (
    <div className="mt-2">
      <ul className={`divide-y ${dark ? 'divide-paper/15' : 'divide-ink/10'}`}>
        {data.roles.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" title={r.title}>{r.title}</p>
              <p className={`truncate text-[11px] ${muted}`}>
                {[showCompany ? r.company : null, r.remote ? 'Remote' : r.location, ago(r.posted_at)].filter(Boolean).join(' · ')}
              </p>
            </div>
            <a
              href={r.apply}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="shrink-0 rounded-full bg-signal px-3 py-1 text-xs font-semibold text-white hover:bg-signal/90"
            >
              Apply ↗
            </a>
          </li>
        ))}
      </ul>
      {data.total > data.roles.length && moreHref && (
        <a href={moreHref} className={`mt-1 inline-block text-xs font-semibold ${dark ? 'text-paper' : 'text-signal'} hover:underline`}>
          See all {Number(data.total).toLocaleString('en-IN')} roles →
        </a>
      )}
    </div>
  );
}
