import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/api';
import { JobRow, openUrl } from '@/components/detail';
import { Body, Button, Chip, Display, Empty, ErrorState, Label, Loading } from '@/components/ui';
import { colors, space } from '@/theme';

const SEARCHES = [
  { label: 'Strategy roles on LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=strategy&location=India' },
  { label: "Founder's office on LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=founder%27s%20office&location=India" },
  { label: 'Browse IIM Jobs', url: 'https://www.iimjobs.com/' },
];

// Hand-picked problem-solving roles. Apply opens the original posting.
export default function JobsScreen() {
  const [source, setSource] = useState<string | null>(null);
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => api.jobs(), staleTime: 10 * 60 * 1000 });
  const all = jobs.data?.jobs || [];
  const sources = useMemo(() => Array.from(new Set(all.map((j) => j.source))), [all]);
  const shown = source ? all.filter((j) => j.source === source) : all;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <FlatList
        data={shown}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={jobs.isRefetching} onRefresh={() => jobs.refetch()} tintColor={colors.ink} />}
        ListHeaderComponent={
          <View style={{ marginBottom: space.sm }}>
            <Label>Curated · 50 at most</Label>
            <Display size={27} style={{ marginTop: 4 }}>Get paid to solve problems</Display>
            <Body muted style={{ marginTop: 4, fontSize: 14 }}>
              Hand-picked strategy, founder's office and problem-solving roles. Apply goes straight to the original posting.
            </Body>
            {sources.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.md, marginHorizontal: -space.lg }} contentContainerStyle={{ gap: 8, paddingHorizontal: space.lg }}>
                <Chip label={`All (${all.length})`} on={!source} onPress={() => setSource(null)} />
                {sources.map((s) => (
                  <Chip key={s} label={s} on={source === s} onPress={() => setSource(s)} />
                ))}
              </ScrollView>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <JobRow job={item} showProblem />}
        ListEmptyComponent={
          jobs.isLoading ? (
            <Loading />
          ) : jobs.isError ? (
            <ErrorState message={(jobs.error as Error).message} onRetry={() => jobs.refetch()} />
          ) : (
            <Empty title="New roles are on their way" body="While we curate the list, these searches are a good start:">
              <View style={{ gap: space.sm, marginTop: space.lg, alignSelf: 'stretch' }}>
                {SEARCHES.map((s) => (
                  <Button key={s.url} title={s.label} variant="ghost" icon="external-link" onPress={() => openUrl(s.url)} />
                ))}
              </View>
            </Empty>
          )
        }
      />
    </SafeAreaView>
  );
}
