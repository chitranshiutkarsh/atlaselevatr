'use client';

import { memo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { CONTINENT_OF } from '@/lib/geo';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function fillFor(weight, max) {
  if (!weight) return '#E3DDCF';
  const t = Math.min(1, Math.sqrt(weight / Math.max(max, 1)));
  // Blend from light ink to signal orange as activity rises.
  const from = [196, 186, 165];
  const to = [228, 87, 46];
  const c = from.map((f, i) => Math.round(f + (to[i] - f) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function WorldMap({ weights, maxWeight, continent, country, center, zoom, onPick }) {
  const stroke = 0.6 / zoom;
  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ scale: 165 }}
      width={800}
      height={400}
      style={{ width: '100%', height: 'auto' }}
    >
      <ZoomableGroup center={center} zoom={zoom} minZoom={1} maxZoom={8} filterZoomEvent={() => false}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
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
            })
          }
        </Geographies>
      </ZoomableGroup>
    </ComposableMap>
  );
}

export default memo(WorldMap);
