import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { api } from '@/api';
import { BuilderCard } from '@/components/detail';
import { Body, Chip, Display, Empty, ErrorState, Label, Loading } from '@/components/ui';
import { useMeta } from '@/hooks';
import { useHidden } from '@/store';
import { colors, space } from '@/theme';

// Public builders board: people building solutions to Atlas problems.
export default function BuildersScreen() {
  const meta = useMeta();
  const { isHidden } = useHidden();
  const [need, setNeed] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['builders', need], queryFn: () => api.builders(need) });
  const items = (q.data?.builders || []).filter((b) => !isHidden('builder', b.id));

  return (
    <FlatList
      data={items}
      keyExtractor={(b) => String(b.id)}
      contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 80 }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.ink} />}
      ListHeaderComponent={
        <View style={{ marginBottom: space.sm }}>
          <Label>Claimed problems</Label>
          <Display size={26} style={{ marginTop: 4 }}>People building the fixes</Display>
          <Body muted style={{ marginTop: 4, fontSize: 14 }}>
            First names, stages and what they need. Want to join one? Ask for an intro and the studio connects you.
          </Body>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.md, marginHorizontal: -space.lg }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.lg }}>
            <Chip label="Everyone" on={!need} onPress={() => setNeed(null)} />
            {meta.builder.needs.map(([k, l]) => (
              <Chip key={k} label={`Needs ${l.toLowerCase()}`} on={need === k} onPress={() => setNeed(k)} />
            ))}
          </ScrollView>
        </View>
      }
      renderItem={({ item }) => <BuilderCard builder={item} meta={meta} showProblem />}
      ListEmptyComponent={
        q.isLoading ? (
          <Loading />
        ) : q.isError ? (
          <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
        ) : (
          <Empty title="No public builders yet" body="Open a problem and tap “I want to build this” to be the first." />
        )
      }
    />
  );
}
