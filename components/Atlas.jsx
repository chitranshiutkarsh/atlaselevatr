'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CONTINENTS, CONTINENT_OF, WORLD_VIEW, prettyName, continentByName } from '@/lib/geo';
import VoteButton from './VoteButton';

const WorldMap = dynamic(() => import('./WorldMap'), {
  ssr: false,
  loading: () => <div className="aspect-[2/1] w-full animate-pulse rounded-xl bg-paper2" />,
});

export default function Atlas({ companies, countryCounts }) {
  const [continent, setContinent] = useState(null);
  const [country, setCountry] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Map weight per country = unicorns there + community problems there.
  const { weights, maxWeight, byContinent, byCountry } = useMemo(() => {
    const weights = {};
    const byContinent = {};
    const byCountry = {};
    for (const c of companies) {
      weights[c.country] = (weights[c.country] || 0) + 1;
      (byContinent[c.continent] ||= []).push(c);
      (byCountry[c.country] ||= []).push(c);
    }
    for (const [name, v] of Object.entries(countryCounts)) {
      weights[name] = (weights[name] || 0) + v.problems;
    }
    const maxWeight = Math.max(1, ...Object.values(weights));
    return { weights, maxWeight, byContinent, byCountry };
  }, [companies, countryCounts]);

  const problemsInContinent = useMemo(() => {
    const totals = {};
    for (const [name, v] of Object.entries(countryCounts)) {
      const cont = CONTINENT_OF[name];
      if (cont) totals[cont] = (totals[cont] || 0) + v.problems;
    }
    return totals;
  }, [countryCounts]);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '8' });
    if (country) params.set('country', country);
    else if (continent) params.set('continent', continent);
    let cancelled = false;
    setLoading(true);
    fetch(`/api/problems?${params}`)
      .then((r) => (r.ok ? r.json() : { problems: [] }))
      .then((d) => !cancelled && setProblems(d.problems || []))
      .catch(() => !cancelled && setProblems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [continent, country]);

  const view = country || continent ? continentByName(continent) : null;
  const center = view ? view.center : WORLD_VIEW.center;
  const zoom = view ? view.zoom : WORLD_VIEW.zoom;

  function pickCountry(name, cont) {
    setContinent(cont);
    setCountry(name);
  }
  function pickContinent(name) {
    setContinent(name);
    setCountry(null);
  }
  function reset() {
    setContinent(null);
    setCountry(null);
  }

  const layer = country ? 'country' : continent ? 'continent' : 'world';
  const scopedCompanies = country ? byCountry[country] || [] : continent ? byContinent[continent] || [] : [];
  const countriesInContinent = continent
    ? Array.from(
        new Set([
          ...(byContinent[continent] || []).map((c) => c.country),
          ...Object.keys(countryCounts).filter((n) => CONTINENT_OF[n] === continent),
        ])
      ).sort((a, b) => prettyName(a).localeCompare(prettyName(b)))
    : [];

  return (
    <section className="mt-6">
      {/* Breadcrumb + continent chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={reset} className={layer === 'world' ? 'chip-on' : 'chip'}>
          World
        </button>
        {CONTINENTS.map((c) => (
          <button
            key={c.slug}
            onClick={() => pickContinent(c.name)}
            className={continent === c.name && !country ? 'chip-on' : 'chip'}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden p-2 sm:p-4">
          <div className="flex items-center justify-between px-2 pb-2">
            <p className="label">
              {layer === 'world' && 'Layer 1 · World'}
              {layer === 'continent' && `Layer 2 · ${continent}`}
              {layer === 'country' && `Layer 3 · ${prettyName(country)}`}
            </p>
            <p className="label hidden sm:block">Tap a country</p>
          </div>
          <WorldMap
            weights={weights}
            maxWeight={maxWeight}
            continent={continent}
            country={country}
            center={center}
            zoom={zoom}
            onPick={pickCountry}
          />
          <div className="flex items-center gap-3 px-2 pt-2 text-xs text-ink2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#E3DDCF]" /> No data yet
            <span className="inline-block h-2.5 w-8 rounded-sm bg-gradient-to-r from-[#C4BAA5] to-signal" /> More unicorns
            &amp; problems
          </div>
        </div>

        {/* Side panel changes with the layer */}
        <aside className="card flex max-h-[640px] flex-col overflow-hidden">
          {layer === 'world' && (
            <div className="overflow-y-auto p-5">
              <h2 className="font-display text-2xl font-semibold">Pick a continent</h2>
              <p className="mt-1 text-sm text-ink2">See its top unicorns and the problems they solved.</p>
              <ul className="mt-4 divide-y divide-ink/10">
                {CONTINENTS.map((c) => {
                  const list = byContinent[c.name] || [];
                  return (
                    <li key={c.slug}>
                      <button
                        onClick={() => pickContinent(c.name)}
                        className="group flex w-full items-start justify-between gap-3 py-3 text-left"
                      >
                        <div>
                          <p className="font-semibold group-hover:text-signal">{c.name}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-ink2">
                            {list.slice(0, 3).map((x) => x.name).join(' · ') || 'No unicorns added yet'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right font-mono text-xs text-ink2">
                          <div>{list.length} unicorns</div>
                          <div>{problemsInContinent[c.name] || 0} problems</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {layer !== 'world' && (
            <div className="overflow-y-auto p-5">
              <button onClick={layer === 'country' ? () => pickContinent(continent) : reset} className="label hover:text-ink">
                ← {layer === 'country' ? continent : 'World'}
              </button>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                {layer === 'country' ? prettyName(country) : continent}
              </h2>

              {layer === 'continent' && countriesInContinent.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {countriesInContinent.map((n) => (
                    <button key={n} onClick={() => pickCountry(n, continent)} className="chip">
                      {prettyName(n)}
                    </button>
                  ))}
                </div>
              )}

              <p className="label mt-5">
                {layer === 'country' ? 'Companies & the problem they solve' : 'Top unicorns & what they solve'}
              </p>
              {scopedCompanies.length === 0 ? (
                <p className="mt-2 text-sm text-ink2">No unicorns listed here yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {scopedCompanies.map((c) => (
                    <li key={c.id} className="rounded-lg border border-ink/10 bg-white p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold">
                          {c.website ? (
                            <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-signal">
                              {c.name}
                            </a>
                          ) : (
                            c.name
                          )}
                        </p>
                        <span className="shrink-0 font-mono text-[10px] uppercase text-ink2">
                          {layer === 'continent' ? prettyName(c.country) : c.industry}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink2">{c.problem}</p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex items-center justify-between">
                <p className="label">Problems people raised here</p>
                <Link
                  href={`/submit${country ? `?country=${encodeURIComponent(country)}` : ''}`}
                  className="text-xs font-semibold text-signal hover:underline"
                >
                  + Add one
                </Link>
              </div>
              {loading ? (
                <p className="mt-2 text-sm text-ink2">Loading…</p>
              ) : problems.length === 0 ? (
                <p className="mt-2 text-sm text-ink2">Nothing yet. Be the first to add one.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {problems.map((p) => (
                    <li key={p.id} className="flex gap-3 rounded-lg border border-ink/10 bg-white p-3">
                      <VoteButton id={p.id} votes={p.votes} compact />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{p.title}</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase text-ink2">
                          {p.industry} · {prettyName(p.country)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
