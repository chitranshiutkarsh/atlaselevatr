import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api';
import { StartupRow } from '@/components/detail';
import { Picker } from '@/components/form';
import { Body, Chip, Display, Empty, ErrorState, Label, Loading } from '@/components/ui';
import { num } from '@/format';
import { useDebounced, useMeta } from '@/hooks';
import { colors, fonts, radius, space } from '@/theme';

const PAGE = 24;

// The startup directory: every startup on Atlas, unicorns first.
export default function StartupsScreen() {
  const params = useLocalSearchParams<{ country?: string }>();
  const meta = useMeta();
  const [country, setCountry] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [unicorn, setUnicorn] = useState(false);
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim(), 400);

  // Opened from a country page: start filtered to that country.
  useEffect(() => {
    if (params.country && meta.countries.some((c) => c.name === params.country)) setCountry(params.country);
  }, [params.country, meta.countries]);

  const filters = useMemo(() => ({ country, industry, unicorn, q: q || null }), [country, industry, unicorn, q]);
  const list = useInfiniteQuery({
    queryKey: ['startups', filters],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => api.startups(filters, pageParam, PAGE),
    getNextPageParam: (last, all) => (all.length * PAGE < last.total ? all.length * PAGE : undefined),
  });

  const items = useMemo(() => list.data?.pages.flatMap((p) => p.companies) || [], [list.data]);
  const total = list.data?.pages[0]?.total;
  const filtered = !!(country || industry || unicorn || q);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={{ marginBottom: space.sm }}>
            <Label>Startup directory</Label>
            <Display size={27} style={{ marginTop: 4 }}>Who's already solving what</Display>
            <Body muted style={{ marginTop: 4, fontSize: 14 }}>
              {total !== undefined ? `${num(total)} ${filtered ? 'match' : 'startups and unicorns across the world'}` : 'Loading…'}
            </Body>
            <View style={st.search}>
              <Feather name="search" size={16} color={colors.ink2} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or what they solve"
                placeholderTextColor={colors.ink3}
                style={st.searchInput}
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>
            <View style={st.filters}>
              <Chip label="🦄 Unicorns" on={unicorn} onPress={() => setUnicorn((u) => !u)} />
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
            </View>
          </View>
        }
        renderItem={({ item }) => <StartupRow startup={item} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
        }}
        refreshControl={<RefreshControl refreshing={list.isRefetching && !list.isFetchingNextPage} onRefresh={() => list.refetch()} tintColor={colors.ink} />}
        ListEmptyComponent={
          list.isLoading ? (
            <Loading />
          ) : list.isError ? (
            <ErrorState message={(list.error as Error).message} onRetry={() => list.refetch()} />
          ) : (
            <Empty title="No startups match" body="Try another search or clear a filter." />
          )
        }
        ListFooterComponent={list.isFetchingNextPage ? <Loading /> : null}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
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
