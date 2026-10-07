'use client';

import { useEffect, useRef, useState } from 'react';
import { DIRECTORY_PAGE_SIZE } from '@/lib/constants';
import { prettyName } from '@/lib/geo';

function buildQuery(filters, offset) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v === true ? '1' : v);
  params.set('limit', String(DIRECTORY_PAGE_SIZE));
  if (offset) params.set('offset', String(offset));
  return params.toString();
}

export default function StartupDirectory({
  country = null,
  continent = null,
  initial = {},
  compact = false,
  syncUrl = false,
}) {
  const [industry, setIndustry] = useState(initial.industry || null);
  const [city, setCity] = useState(initial.city || null);
  const [unicorn, setUnicorn] = useState(Boolean(initial.unicorn));
  const [query, setQuery] = useState(initial.q || '');
  const [q, setQ] = useState(initial.q || '');
  const [data, setData] = useState({ companies: [], total: 0, industries: [], cities: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);

  // Reset category/city when the map scope changes.
  const scopeKey = `${country}|${continent}`;
  const firstScope = useRef(scopeKey);
  useEffect(() => {
    if (firstScope.current === scopeKey) return;
    firstScope.current = scopeKey;
    setIndustry(null);
    setCity(null);
  }, [scopeKey]);

  // Debounce typing in the search box.
  useEffect(() => {
    const t = setTimeout(() => setQ(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filters = { country, continent, industry, city, q, unicorn };

  useEffect(() => {
    const id = ++request.current;
    setLoading(true);
    setError('');
    fetch(`/api/companies?${buildQuery(filters, 0)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load startups'))))
      .then((d) => id === request.current && setData(d))
      .catch((e) => id === request.current && setError(e.message))
      .finally(() => id === request.current && setLoading(false));

    if (syncUrl) {
      const params = new URLSearchParams();
      if (country) params.set('country', country);
      if (continent && !country) params.set('continent', continent);
      if (industry) params.set('industry', industry);
      if (city) params.set('city', city);
      if (q) params.set('q', q);
      if (unicorn) params.set('unicorn', '1');
      const qs = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, continent, industry, city, q, unicorn]);

  async function loadMore() {
    const id = request.current;
    setLoadingMore(true);
    try {
      const r = await fetch(`/api/companies?${buildQuery(filters, data.companies.length)}`);
      const d = await r.json();
      if (id === request.current) setData((prev) => ({ ...prev, companies: [...prev.companies, ...d.companies] }));
    } finally {
      setLoadingMore(false);
    }
  }

  const totalInScope = data.industries.reduce((sum, i) => sum + i.count, 0);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search startups, sectors, what they do…"
          className="input"
          aria-label="Search startups"
        />
        <button
          onClick={() => setUnicorn((u) => !u)}
          className={`${unicorn ? 'chip-on' : 'chip'} shrink-0 justify-center py-2`}
          aria-pressed={unicorn}
        >
          ★ Unicorns only
        </button>
      </div>

      {/* Categories with counts */}
      <div className={`mt-3 flex gap-1.5 ${compact ? 'flex-wrap' : 'flex-wrap'}`}>
        <button onClick={() => setIndustry(null)} className={!industry ? 'chip-on' : 'chip'}>
          All <span className="ml-1 font-mono opacity-70">{totalInScope.toLocaleString('en-IN')}</span>
        </button>
        {data.industries.map((i) => (
          <button
            key={i.industry}
            onClick={() => setIndustry(industry === i.industry ? null : i.industry)}
            className={industry === i.industry ? 'chip-on' : 'chip'}
          >
            {i.industry} <span className="ml-1 font-mono opacity-70">{i.count.toLocaleString('en-IN')}</span>
          </button>
        ))}
      </div>

      {/* Cities */}
      {data.cities.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">City</span>
          <button onClick={() => setCity(null)} className={!city ? 'chip-on' : 'chip'}>Any</button>
          {data.cities.slice(0, compact ? 8 : 15).map((c) => (
            <button
              key={c.city}
              onClick={() => setCity(city === c.city ? null : c.city)}
              className={city === c.city ? 'chip-on' : 'chip'}
            >
              {c.city} <span className="ml-1 font-mono opacity-70">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      <p className="label mt-4">
        {loading ? 'Loading…' : `${data.total.toLocaleString('en-IN')} startup${data.total === 1 ? '' : 's'}`}
      </p>

      {error && <p className="mt-2 text-sm text-signal">{error}</p>}

      <ul className={`mt-2 grid gap-2 ${compact ? '' : 'sm:grid-cols-2 lg:grid-cols-3'} ${loading ? 'opacity-50' : ''}`}>
        {data.companies.map((c) => (
          <li key={c.id} className="rounded-lg border border-ink/10 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold leading-snug">
                {c.website ? (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-signal">{c.name}</a>
                ) : (
                  c.name
                )}
                {c.is_unicorn && (
                  <span className="ml-1.5 rounded-full bg-signal/10 px-1.5 py-0.5 align-middle font-mono text-[9px] uppercase text-signal">
                    Unicorn
                  </span>
                )}
              </p>
              <span className="shrink-0 font-mono text-[10px] uppercase text-ink2">{c.industry}</span>
            </div>
            <p className="mt-1 line-clamp-3 text-sm text-ink2">{c.problem}</p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-ink2/80">
              {[c.city || (c.country !== 'India' ? prettyName(c.country) : null), c.sector, c.last_funded ? `funded ${c.last_funded}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </li>
        ))}
      </ul>

      {!loading && data.companies.length === 0 && !error && (
        <p className="mt-3 text-sm text-ink2">No startups match. Try another category or clear the search.</p>
      )}

      {data.companies.length < data.total && (
        <button onClick={loadMore} disabled={loadingMore} className="btn-ghost mt-4 w-full">
          {loadingMore ? 'Loading…' : `Show more (${(data.total - data.companies.length).toLocaleString('en-IN')} left)`}
        </button>
      )}
    </div>
  );
}
