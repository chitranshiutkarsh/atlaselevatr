import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api';
import { Body, Button, Card, Chip, Display, Graticule, Label, Stat } from '@/components/ui';
import { MapPlaceholder, SCALES, useWorld, WorldMap } from '@/components/WorldMap';
import { num } from '@/format';
import { useCountryLabel, useMeta } from '@/hooks';
import { colors, fonts, radius, space } from '@/theme';
import type { CountryStats } from '@/types';

type Mode = 'problems' | 'startups';

const EMPTY: CountryStats = { companies: 0, unicorns: 0, problems: 0, votes: 0, gaps: 0 };

export default function AtlasScreen() {
  const meta = useMeta();
  const countryLabel = useCountryLabel();
  const { width } = useWindowDimensions();
  const mapWidth = width - space.lg * 2 - 2;
  const [mode, setMode] = useState<Mode>('problems');
  const [continent, setContinent] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const home = useQuery({ queryKey: ['home'], queryFn: api.home, staleTime: 5 * 60 * 1000 });
  const world = useWorld();

  const continentOf = useMemo(() => new Map(meta.countries.map((c) => [c.name, c.continent])), [meta]);
  const countries = home.data?.countries || {};

  const values = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [name, c] of Object.entries(countries)) out[name] = mode === 'problems' ? c.problems : c.companies;
    return out;
  }, [countries, mode]);

  const ranking = useMemo(
    () =>
      Object.entries(countries)
        .filter(([name]) => !continent || continentOf.get(name) === continent)
        .map(([name, c]) => ({ name, ...c }))
        .filter((c) => (mode === 'problems' ? c.problems : c.companies) > 0)
        .sort((a, b) => (mode === 'problems' ? b.problems - a.problems || b.votes - a.votes : b.companies - a.companies))
        .slice(0, 10),
    [countries, continent, continentOf, mode]
  );

  const sel = selected ? { ...EMPTY, ...countries[selected] } : null;
  const stats = home.data?.stats;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: 80, gap: space.lg }}
        refreshControl={
          <RefreshControl
            refreshing={home.isRefetching}
            onRefresh={() => {
              home.refetch();
              if (world.isError) world.refetch();
            }}
            tintColor={colors.ink}
          />
        }
      >
        <Graticule height={200} />
        <View>
          <Label>The Atlas</Label>
          <Display size={27} style={{ marginTop: 4 }}>Where the problems are, and who's solving them.</Display>
        </View>

        {stats ? (
          <View style={st.stats}>
            <Stat value={num(stats.problems)} label="Problems" />
            <Stat value={num(stats.votes)} label="People facing" />
            <Stat value={num(stats.companies)} label="Startups" />
            <Stat value={num(stats.countries)} label="Countries" />
          </View>
        ) : null}

        <View style={{ gap: space.sm }}>
          <View style={st.row}>
            <Chip label="Problems" icon="alert-circle" on={mode === 'problems'} onPress={() => setMode('problems')} />
            <Chip label="Startups" icon="trending-up" on={mode === 'startups'} onPress={() => setMode('startups')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: space.lg }} style={{ marginHorizontal: -space.lg }}>
            <Chip label="World" on={!continent} onPress={() => { setContinent(null); setSelected(null); }} />
            {meta.continents.map((c) => (
              <Chip key={c.name} label={c.name} on={continent === c.name} onPress={() => { setContinent(c.name); setSelected(null); }} />
            ))}
          </ScrollView>
        </View>

        <View style={st.mapCard}>
          {world.data ? (
            <WorldMap
              countries={world.data}
              width={mapWidth}
              continent={continent}
              values={values}
              scale={SCALES[mode]}
              selected={selected}
              onSelect={setSelected}
            />
          ) : (
            <MapPlaceholder width={mapWidth} continent={continent} error={world.isError ? 'The map could not load. Pull down to retry.' : undefined} />
          )}
          <View style={st.legend}>
            <View style={[st.swatch, { backgroundColor: colors.paper2 }]} />
            <Text style={st.legendText}>None</Text>
            <View style={[st.swatch, { backgroundColor: SCALES[mode].low }]} />
            <Text style={st.legendText}>Few</Text>
            <View style={[st.swatch, { backgroundColor: SCALES[mode].high }]} />
            <Text style={st.legendText}>Most {mode}</Text>
          </View>
        </View>

        {selected && sel ? (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Label>{continentOf.get(selected) || 'Country'}</Label>
                <Display size={22} style={{ marginTop: 2 }}>{countryLabel(selected)}</Display>
              </View>
              <Pressable onPress={() => setSelected(null)} hitSlop={10} accessibilityLabel="Close">
                <Feather name="x" size={20} color={colors.ink2} />
              </Pressable>
            </View>
            <View style={[st.stats, { marginTop: space.md }]}>
              <Stat value={num(sel.problems)} label="Problems" />
              <Stat value={num(sel.votes)} label="Facing" />
              <Stat value={num(sel.companies)} label="Startups" />
              <Stat value={num(sel.unicorns)} label="Unicorns" />
            </View>
            {sel.gaps ? <Body muted style={{ marginTop: space.sm, fontSize: 14 }}>{num(sel.gaps)} problems here have no local startup working on them yet.</Body> : null}
            {continentOf.has(selected) ? (
              <Button title={`Open ${countryLabel(selected)}`} icon="arrow-right" style={{ marginTop: space.md }} onPress={() => router.push(`/country/${encodeURIComponent(selected)}`)} />
            ) : (
              <Body muted style={{ marginTop: space.sm }}>Nothing on Atlas here yet.</Body>
            )}
          </Card>
        ) : (
          <Body muted style={{ textAlign: 'center', fontSize: 14 }}>Tap a country to see its problems and startups.</Body>
        )}

        <View style={{ gap: space.sm }}>
          <Label>{`Top ${continent || 'countries'} · by ${mode}`}</Label>
          {ranking.length === 0 ? <Body muted>Nothing here yet.</Body> : null}
          {ranking.map((c, i) => (
            <Pressable
              key={c.name}
              onPress={() => router.push(`/country/${encodeURIComponent(c.name)}`)}
              style={({ pressed }) => [st.rankRow, pressed && { opacity: 0.85 }]}
            >
              <Text style={st.rankNum}>{i + 1}</Text>
              <Text style={st.rankName} numberOfLines={1}>{countryLabel(c.name)}</Text>
              <Text style={st.rankValue}>
                {mode === 'problems' ? `${num(c.problems)} problems` : `${num(c.companies)} startups`}
              </Text>
              <Feather name="chevron-right" size={16} color={colors.ink3} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  stats: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.md },
  row: { flexDirection: 'row', gap: 8 },
  mapCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink2, marginRight: 8 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rankNum: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink3, width: 18 },
  rankName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, flex: 1 },
  rankValue: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink2 },
});
