'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CONTINENTS, CONTINENT_OF, WORLD_VIEW, prettyName, continentByName } from '@/lib/geo';
import StartupDirectory from './StartupDirectory';
import VoteButton from './VoteButton';

const WorldMap = dynamic(() => import('./WorldMap'), {
  ssr: false,
  loading: () => <div className="aspect-[2/1] w-full animate-pulse rounded-xl bg-paper2" />,
});

const fmt = (n) => (n || 0).toLocaleString('en-IN');

export default function Atlas({ unicorns, countryCounts }) {
  const [continent, setContinent] = useState(null);
  const [country, setCountry] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Map shading = startups + community problems in each country.
  const { weights, maxWeight, continentTotals, unicornsByContinent, unicornsByCountry } = useMemo(() => {
    const weights = {};
    const continentTotals = {};
    for (const [name, v] of Object.entries(countryCounts)) {
      weights[name] = (v.companies || 0) + (v.problems || 0);
      const cont = CONTINENT_OF[name];
      if (!cont) continue;
      const t = (continentTotals[cont] ||= { companies: 0, problems: 0 });
      t.companies += v.companies || 0;
      t.problems += v.problems || 0;
    }
    const unicornsByContinent = {};
    const unicornsByCountry = {};
    for (const u of unicorns) {
      (unicornsByContinent[u.continent] ||= []).push(u);
      (unicornsByCountry[u.country] ||= []).push(u);
    }
    return {
      weights,
      maxWeight: Math.max(1, ...Object.values(weights)),
      continentTotals,
      unicornsByContinent,
      unicornsByCountry,
    };
  }, [unicorns, countryCounts]);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '6' });
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

  const view = continent ? continentByName(continent) : null;
  const center = view ? view.center : WORLD_VIEW.center;
  const zoom = view ? view.zoom : WORLD_VIEW.zoom;

  const pickCountry = (name, cont) => {
    setContinent(cont);
    setCountry(name);
  };
  const pickContinent = (name) => {
    setContinent(name);
    setCountry(null);
  };
  const reset = () => {
    setContinent(null);
    setCountry(null);
  };

  const layer = country ? 'country' : continent ? 'continent' : 'world';
  const scopedUnicorns = country ? unicornsByCountry[country] || [] : continent ? unicornsByContinent[continent] || [] : [];
  const countriesInContinent = continent
    ? Object.entries(countryCounts)
        .filter(([n]) => CONTINENT_OF[n] === continent)
        .sort((a, b) => (b[1].companies + b[1].problems) - (a[1].companies + a[1].problems))
    : [];
  const scopeCount = country ? countryCounts[country]?.companies || 0 : continentTotals[continent]?.companies || 0;

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={reset} className={layer === 'world' ? 'chip-on' : 'chip'}>World</button>
        {CONTINENTS.map((c) => (
          <button key={c.slug} onClick={() => pickContinent(c.name)} className={continent === c.name && !country ? 'chip-on' : 'chip'}>
            {c.name}
          </button>
        ))}
        <button onClick={() => pickCountry('India', 'Asia')} className={country === 'India' ? 'chip-on' : 'chip'}>
          🇮🇳 India
        </button>
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
          <div className="flex flex-wrap items-center gap-3 px-2 pt-2 text-xs text-ink2">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#E3DDCF]" /> No data yet
            <span className="inline-block h-2.5 w-8 rounded-sm bg-gradient-to-r from-[#C4BAA5] to-signal" /> More startups &amp; problems
          </div>
        </div>

        <aside className="card flex max-h-[640px] flex-col overflow-hidden">
          {layer === 'world' ? (
            <div className="overflow-y-auto p-5">
              <h2 className="font-display text-2xl font-semibold">Pick a continent</h2>
              <p className="mt-1 text-sm text-ink2">See its unicorns, every startup by category, and the problems people raised.</p>
              <ul className="mt-4 divide-y divide-ink/10">
                {CONTINENTS.map((c) => {
                  const list = unicornsByContinent[c.name] || [];
                  const t = continentTotals[c.name] || {};
                  return (
                    <li key={c.slug}>
                      <button onClick={() => pickContinent(c.name)} className="group flex w-full items-start justify-between gap-3 py-3 text-left">
                        <div className="min-w-0">
                          <p className="font-semibold group-hover:text-signal">{c.name}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-ink2">
                            {list.slice(0, 4).map((x) => x.name).join(' · ') || 'No unicorns added yet'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right font-mono text-xs text-ink2">
                          <div>{fmt(t.companies)} startups</div>
                          <div>{fmt(t.problems)} problems</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="overflow-y-auto p-5">
              <button onClick={layer === 'country' ? () => pickContinent(continent) : reset} className="label hover:text-ink">
                ← {layer === 'country' ? continent : 'World'}
              </button>
              <h2 className="mt-2 font-display text-2xl font-semibold">{layer === 'country' ? prettyName(country) : continent}</h2>
              <p className="mt-1 font-mono text-xs text-ink2">
                {fmt(scopeCount)} startups · {fmt(scopedUnicorns.length)} unicorns
              </p>

              {layer === 'continent' && countriesInContinent.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {countriesInContinent.map(([n, v]) => (
                    <button key={n} onClick={() => pickCountry(n, continent)} className="chip">
                      {prettyName(n)} <span className="ml-1 font-mono opacity-70">{fmt(v.companies)}</span>
                    </button>
                  ))}
                </div>
              )}

              <p className="label mt-5">Unicorns &amp; the problem they solve</p>
              {scopedUnicorns.length === 0 ? (
                <p className="mt-2 text-sm text-ink2">No unicorns listed here yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {scopedUnicorns.slice(0, 40).map((c) => (
                    <li key={c.id} className="rounded-lg border border-ink/10 bg-white p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold">{c.name}</p>
                        <span className="shrink-0 font-mono text-[10px] uppercase text-ink2">
                          {layer === 'continent' ? prettyName(c.country) : c.city || c.industry}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-ink2">{c.problem}</p>
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

      {/* Bottom layer: every startup in scope, by category */}
      {layer !== 'world' && (
        <div className="card mt-6 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="label">All startups</p>
              <h3 className="font-display text-2xl font-semibold">
                {fmt(scopeCount)} startups in {layer === 'country' ? prettyName(country) : continent}, by category
              </h3>
            </div>
            <Link
              href={country ? `/startups?country=${encodeURIComponent(country)}` : `/startups?continent=${encodeURIComponent(continent)}`}
              className="text-sm font-semibold text-signal hover:underline"
            >
              Open full directory →
            </Link>
          </div>
          <StartupDirectory country={country} continent={country ? null : continent} />
        </div>
      )}
    </section>
  );
}
