import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, type Sort } from '@/api';
import { Picker } from '@/components/form';
import { ProblemCard } from '@/components/ProblemCard';
import { Body, Button, Chip, Display, Empty, ErrorState, Graticule, Label, Loading } from '@/components/ui';
import { num } from '@/format';
import { useCountryLabel, useDebounced, useFace, useFaced, useMeta } from '@/hooks';
import { useHidden } from '@/store';
import { colors, fonts, radius, space } from '@/theme';
import type { ProblemSummary } from '@/types';

const TABS: { key: Sort; label: string; hint: string }[] = [
  { key: 'top', label: 'Most faced', hint: 'Ranked by how many people face them.' },
  { key: 'gaps', label: 'Gaps', hint: 'Lots of people face it, few startups work on it.' },
  { key: 'new', label: 'Newest', hint: 'Just added by people like you.' },
  { key: 'discover', label: 'Discover', hint: 'A fresh mix every time you pull down.' },
];

const PAGE = 20;

export default function ProblemsScreen() {
  const meta = useMeta();
  const countryLabel = useCountryLabel();
  const isFaced = useFaced();
  const face = useFace();
  const { isHidden } = useHidden();

  const [sort, setSort] = useState<Sort>('top');
  const [country, setCountry] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 400);
  const filters = useMemo(() => ({ country, industry, q: q || null }), [country, industry, q]);

  const home = useQuery({ queryKey: ['home'], queryFn: api.home, staleTime: 5 * 60 * 1000 });

  const list = useInfiniteQuery({
    queryKey: ['problems', sort, filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (sort === 'gaps') return (await api.gaps(filters)).problems;
      if (sort === 'discover') return (await api.problems('discover', filters, 0, 30)).problems;
      return (await api.problems(sort, filters, pageParam, PAGE)).problems;
    },
    getNextPageParam: (last, all) =>
      sort === 'gaps' || sort === 'discover' || last.length < PAGE ? undefined : all.length * PAGE,
  });

  const items = useMemo(() => {
    const seen = new Set<number>();
    const out: ProblemSummary[] = [];
    for (const page of list.data?.pages || []) {
      for (const p of page) {
        if (seen.has(p.id) || isHidden('problem', p.id)) continue;
        seen.add(p.id);
        out.push(p);
      }
    }
    return out;
  }, [list.data, isHidden]);

  const onFace = useCallback((id: number) => face.mutate(id), [face]);
  const filtered = !!(country || industry || q);
  const stats = home.data?.stats;

  const header = (
    <View>
      <Graticule height={260} />
      <View style={st.brand}>
        <View>
          <Text style={st.logo}>Atlas</Text>
          <Text style={st.by}>by {meta.site.parent}</Text>
        </View>
        <Button title="Add a problem" icon="plus" small onPress={() => router.push('/submit')} />
      </View>
      <Display size={27} style={{ marginTop: space.lg }}>
        Every unsolved problem on Earth, mapped and ranked.
      </Display>
      {stats ? (
        <Body muted style={{ marginTop: 6, fontSize: 14 }}>
          {num(stats.problems)} problems · {num(stats.votes)} people face them · {num(stats.companies)} startups
        </Body>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabs} style={{ marginHorizontal: -space.lg }}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setSort(t.key)} style={[st.tab, sort === t.key && st.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: sort === t.key }}>
            <Text style={[st.tabText, sort === t.key && st.tabTextOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Label style={{ marginTop: space.sm }}>{TABS.find((t) => t.key === sort)?.hint}</Label>

      <View style={st.search}>
        <Feather name="search" size={16} color={colors.ink2} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search problems"
          placeholderTextColor={colors.ink3}
          style={st.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <View style={st.filters}>
        <Picker
          compact
          title="Country"
          placeholder="Any country"
          value={country}
          onChange={setCountry}
          allowClear
          options={meta.countries.map((c) => ({ value: c.name, label: c.label, hint: c.continent }))}
        />
        <Picker
          compact
          title="Industry"
          placeholder="Any industry"
          value={industry}
          onChange={setIndustry}
          allowClear
          options={meta.industries.map((i) => ({ value: i, label: i }))}
        />
        {filtered ? (
          <Chip
            label="Clear"
            icon="x"
            onPress={() => {
              setCountry(null);
              setIndustry(null);
              setSearch('');
            }}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 }}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={{ marginBottom: space.sm }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item, index }) => (
          <ProblemCard
            problem={item}
            countryLabel={countryLabel(item.country)}
            faced={isFaced(item.id)}
            onFace={onFace}
            rank={sort === 'top' && !filtered ? index + 1 : undefined}
          />
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching && !list.isFetchingNextPage}
            onRefresh={() => {
              list.refetch();
              home.refetch();
            }}
            tintColor={colors.ink}
          />
        }
        ListEmptyComponent={
          list.isLoading ? (
            <Loading />
          ) : list.isError ? (
            <ErrorState message={(list.error as Error).message} onRetry={() => list.refetch()} />
          ) : (
            <Empty
              title={filtered ? 'Nothing matches yet' : 'No problems here yet'}
              body={sort === 'gaps' ? 'Gaps appear once people open a problem and the startup check has run.' : 'Be the first to add one.'}
            >
              <Button title="Add a problem" icon="plus" style={{ marginTop: space.lg }} onPress={() => router.push({ pathname: '/submit', params: country ? { country } : {} })} />
            </Empty>
          )
        }
        ListFooterComponent={list.isFetchingNextPage ? <Loading /> : null}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm },
  logo: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  by: { fontFamily: fonts.body, fontSize: 11, color: colors.ink2, marginTop: -2 },
  tabs: { gap: 8, paddingHorizontal: space.lg, marginTop: space.xl },
  tab: {
    paddingHorizontal: 16,
    height: 38,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  tabOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  tabText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink2 },
  tabTextOn: { color: colors.paper },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: space.lg,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20,33,61,0.15)',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, height: 44, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
});
