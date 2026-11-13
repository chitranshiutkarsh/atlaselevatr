'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { CONTINENT_OF } from '@/lib/geo';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function fillFor(weight, max) {
  if (!weight) return '#E3DDCF';
  // Log scale so one very busy country (India) doesn't wash out the rest.
  const t = Math.min(1, Math.log1p(weight) / Math.log1p(Math.max(max, 1)));
  // Blend from light ink to signal orange as activity rises.
  const from = [196, 186, 165];
  const to = [228, 87, 46];
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 12;
// Plain scrolling (and one-finger swipes on phones) keep scrolling the page;
// ctrl/⌘ + scroll, a trackpad pinch, two fingers or a mouse drag move the map.
const zoomFilter = (e) => {
  if (e.type === 'wheel') return e.ctrlKey || e.metaKey;
  if (e.type && e.type.startsWith('touch')) return (e.touches?.length || 0) >= 2;
  return !e.button;
};
const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

// Scale up / scale down like a city map: + and − buttons, drag to move,
// pinch or ctrl/⌘ + scroll to zoom. Count bubbles show where the activity is.
function WorldMap({ weights, maxWeight, continent, country, center, zoom, onPick }) {
  const [pos, setPos] = useState({ coordinates: center, zoom });
  // A new layer (world → continent → country) re-centres the map.
  useEffect(() => {
    setPos({ coordinates: center, zoom });
  }, [center[0], center[1], zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMoveEnd = useCallback(({ coordinates, zoom: z }) => setPos({ coordinates, zoom: z }), []);
  const k = pos.zoom;
  const stroke = 0.6 / k;
  const scaleBy = (f) => setPos((p) => ({ ...p, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, p.zoom * f)) }));
  const moved = Math.abs(k - zoom) > 0.01 || pos.coordinates[0] !== center[0] || pos.coordinates[1] !== center[1];
  // More bubbles as you zoom in; only the busiest countries on the world view.
  const bubbleMin = maxWeight * (k >= 4 ? 0 : k >= 2 ? 0.002 : 0.01);

  return (
    <div className="relative">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 165 }}
        width={800}
        height={400}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup
          center={pos.coordinates}
          zoom={k}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={onMoveEnd}
          filterZoomEvent={zoomFilter}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies, path }) => (
              <>
                {geographies.map((geo) => {
                  const name = geo.properties.name;
                  const cont = CONTINENT_OF[name];
                  const dim = continent && cont !== continent;
                  const selected = country === name;
                  const base = fillFor(weights[name] || 0, maxWeight);
                  const fill = selected ? '#14213D' : base;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => cont && onPick(name, cont)}
                      tabIndex={cont ? 0 : -1}
                      aria-label={name}
                      onKeyDown={(e) => {
                        if (cont && (e.key === 'Enter' || e.key === ' ')) onPick(name, cont);
                      }}
                      style={{
                        default: {
                          fill,
                          opacity: dim ? 0.28 : 1,
                          stroke: '#F4F1EA',
                          strokeWidth: stroke,
                          outline: 'none',
                          transition: 'opacity 250ms',
                        },
                        hover: {
                          fill: cont ? (selected ? '#14213D' : '#E4572E') : fill,
                          opacity: 1,
                          stroke: '#F4F1EA',
                          strokeWidth: stroke,
                          outline: 'none',
                          cursor: cont ? 'pointer' : 'default',
                        },
                        pressed: { fill: '#14213D', outline: 'none' },
                      }}
                    >
                      <title>{name}</title>
                    </Geography>
                  );
                })}
                {geographies.map((geo) => {
                  const name = geo.properties.name;
                  const cont = CONTINENT_OF[name];
                  const w = weights[name] || 0;
                  if (!cont || !w || w < bubbleMin) return null;
                  if (continent && cont !== continent) return null;
                  const [x, y] = path.centroid(geo);
                  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
                  const label = fmt(w);
                  const r = (6 + label.length * 2.2) / k;
                  return (
                    <g
                      key={`b-${geo.rsmKey}`}
                      transform={`translate(${x},${y})`}
                      onClick={() => onPick(name, cont)}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle r={r} fill="#FFFFFF" stroke="#14213D" strokeOpacity={0.25} strokeWidth={0.8 / k} />
                      <text
                        textAnchor="middle"
                        dy="0.35em"
                        style={{ fontSize: 7 / k, fontWeight: 600, fill: '#14213D', fontFamily: 'var(--font-mono), monospace', pointerEvents: 'none' }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-2 right-2 flex flex-col overflow-hidden rounded-lg border border-ink/15 bg-white shadow-sm">
        <button type="button" onClick={() => scaleBy(1.6)} disabled={k >= MAX_ZOOM} aria-label="Zoom in"
          className="h-9 w-9 text-lg leading-none text-ink hover:bg-paper2 disabled:opacity-30">+</button>
        <button type="button" onClick={() => scaleBy(1 / 1.6)} disabled={k <= MIN_ZOOM} aria-label="Zoom out"
          className="h-9 w-9 border-t border-ink/10 text-lg leading-none text-ink hover:bg-paper2 disabled:opacity-30">−</button>
        <button type="button" onClick={() => setPos({ coordinates: center, zoom })} disabled={!moved} aria-label="Reset view"
          title="Reset view" className="h-9 w-9 border-t border-ink/10 text-sm leading-none text-ink hover:bg-paper2 disabled:opacity-30">⌖</button>
      </div>
      <p className="pointer-events-none absolute bottom-2 left-2 hidden rounded bg-white/80 px-2 py-0.5 text-[10px] text-ink2 sm:block">
        Drag to move · pinch or ctrl/⌘ + scroll to zoom
      </p>
    </div>
  );
}

export default memo(WorldMap);
