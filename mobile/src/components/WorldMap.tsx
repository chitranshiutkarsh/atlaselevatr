import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { geoEqualEarth, geoGraticule10, geoPath, type GeoProjection } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { memo, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { API_URL } from '../api';
import { colors } from '../theme';
import { Body } from './ui';

// The same country outlines the website uses (world-atlas, 1:110m). Fetched
// once from atlaselevatr.in and kept on the phone for offline use.
const CACHE_KEY = 'atlas.world.v1';
const FALLBACK = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type Country = Feature<Geometry, { name: string }>;

async function loadWorld(): Promise<Country[]> {
  let text = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
  if (!text) {
    for (const url of [`${API_URL}/api/app/world`, FALLBACK]) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          text = await res.text();
          break;
        }
      } catch {
        // try the next source
      }
    }
    if (!text) throw new Error('Could not load the map.');
    AsyncStorage.setItem(CACHE_KEY, text).catch(() => {});
  }
  const topo = JSON.parse(text) as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>;
  return fc.features.filter((f) => f.properties?.name && f.properties.name !== 'Antarctica');
}

export function useWorld() {
  return useQuery({ queryKey: ['world'], queryFn: loadWorld, staleTime: Infinity, gcTime: Infinity, retry: 2 });
}

// Where each continent view is centred and how far it zooms (same as the website).
export const CONTINENT_VIEW: Record<string, { center: [number, number]; zoom: number }> = {
  Asia: { center: [92, 28], zoom: 2.1 },
  Europe: { center: [18, 53], zoom: 3.6 },
  Africa: { center: [20, 2], zoom: 2.4 },
  'North America': { center: [-96, 42], zoom: 2.2 },
  'South America': { center: [-60, -20], zoom: 2.4 },
  Oceania: { center: [148, -26], zoom: 3 },
};

export function mapHeight(width: number, continent: string | null) {
  return Math.round(width * (continent ? 0.78 : 0.5));
}

function projectionFor(width: number, height: number, continent: string | null): GeoProjection {
  const p = geoEqualEarth();
  if (!continent || !CONTINENT_VIEW[continent]) {
    return p.fitExtent([[4, 4], [width - 4, height - 4]], { type: 'Sphere' });
  }
  const view = CONTINENT_VIEW[continent];
  p.scale((165 / 800) * width * view.zoom).translate([width / 2, height / 2]);
  const [x, y] = p(view.center) || [width / 2, height / 2];
  return p.translate([width - x, height - y]);
}

function hex(c: string) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

export const SCALES = {
  problems: { low: '#F7CDBE', high: colors.signal },
  startups: { low: '#C9D0DE', high: colors.ink },
};

type Props = {
  countries: Country[];
  width: number;
  continent: string | null;
  values: Record<string, number>;
  scale: { low: string; high: string };
  selected: string | null;
  onSelect: (name: string) => void;
};

function WorldMapInner({ countries, width, continent, values, scale, selected, onSelect }: Props) {
  const height = mapHeight(width, continent);
  const { paths, sphere, graticule } = useMemo(() => {
    const projection = projectionFor(width, height, continent);
    const path = geoPath(projection);
    return {
      paths: countries.map((c) => ({ name: c.properties.name, d: path(c) || '' })),
      sphere: path({ type: 'Sphere' }) || '',
      graticule: path(geoGraticule10()) || '',
    };
  }, [countries, width, height, continent]);

  const max = Math.max(1, ...Object.values(values));
  const fillFor = (name: string) => {
    const v = values[name] || 0;
    if (!v) return colors.paper2;
    const t = Math.log(1 + v) / Math.log(1 + max);
    return mix(scale.low, scale.high, 0.15 + 0.85 * t);
  };

  return (
    <Svg width={width} height={height}>
      <Path d={sphere} fill="#FBFAF6" stroke={colors.lineStrong} strokeWidth={0.8} />
      <Path d={graticule} fill="none" stroke={colors.ink} strokeOpacity={0.07} strokeWidth={0.6} />
      <G>
        {paths.map((p) =>
          p.d ? (
            <Path
              key={p.name}
              d={p.d}
              fill={fillFor(p.name)}
              stroke={p.name === selected ? colors.ink : colors.paper}
              strokeWidth={p.name === selected ? 1.6 : 0.5}
              onPress={() => onSelect(p.name)}
            />
          ) : null
        )}
      </G>
    </Svg>
  );
}

export const WorldMap = memo(WorldMapInner);

export function MapPlaceholder({ width, continent, error }: { width: number; continent: string | null; error?: string }) {
  return (
    <View style={{ width, height: mapHeight(width, continent), alignItems: 'center', justifyContent: 'center' }}>
      {error ? <Body muted>{error}</Body> : <ActivityIndicator color={colors.ink} />}
    </View>
  );
}
