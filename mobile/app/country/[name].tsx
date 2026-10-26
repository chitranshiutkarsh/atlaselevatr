import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { api } from '@/api';
import { StartupRow } from '@/components/detail';
import { ProblemCard } from '@/components/ProblemCard';
import { Body, Button, Display, ErrorState, Label, Loading, SectionTitle, Stat } from '@/components/ui';
import { num } from '@/format';
import { useCountryLabel, useFace, useFaced, useMeta } from '@/hooks';
import { useHidden } from '@/store';
import { colors, space } from '@/theme';

// One country: its problems, its unicorns and a way into its startups.
export default function CountryScreen() {
  const { name: raw } = useLocalSearchParams<{ name: string }>();
  const name = decodeURIComponent(raw || '');
  const meta = useMeta();
  const countryLabel = useCountryLabel();
  const isFaced = useFaced();
  const face = useFace();
  const { isHidden } = useHidden();
  const info = meta.countries.find((c) => c.name === name);

  const home = useQuery({ queryKey: ['home'], queryFn: api.home, staleTime: 5 * 60 * 1000 });
  const problems = useQuery({
    queryKey: ['problems', 'country', name],
    queryFn: () => api.problems('top', { country: name }, 0, 30),
    enabled: !!info,
  });
  const unicorns = useQuery({
    queryKey: ['startups', 'unicorns', name],
    queryFn: () => api.startups({ country: name, unicorn: true }, 0, 12),
    enabled: !!info,
  });

  if (!info) return <ErrorState message="This country isn't on Atlas yet." />;

  const c = home.data?.countries[name];
  const list = (problems.data?.problems || []).filter((p) => !isHidden('problem', p.id));

  return (
    <ScrollView
      contentContainerStyle={{ padding: space.lg, paddingBottom: 80, gap: space.xl }}
      refreshControl={
        <RefreshControl
          refreshing={problems.isRefetching}
          onRefresh={() => {
            problems.refetch();
            unicorns.refetch();
            home.refetch();
          }}
          tintColor={colors.ink}
        />
      }
    >
      <Stack.Screen options={{ title: countryLabel(name) }} />
      <View>
        <Label>{info.continent}</Label>
        <Display size={32} style={{ marginTop: 2 }}>{countryLabel(name)}</Display>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.md, marginTop: space.lg }}>
          <Stat value={num(c?.problems)} label="Problems" />
          <Stat value={num(c?.votes)} label="Facing" />
          <Stat value={num(c?.companies)} label="Startups" />
          <Stat value={num(c?.unicorns)} label="Unicorns" />
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <SectionTitle
          eyebrow="Ranked by people facing them"
          title={`Problems in ${countryLabel(name)}`}
          right={<Button title="Add" small icon="plus" onPress={() => router.push({ pathname: '/submit', params: { country: name } })} />}
        />
        {problems.isLoading ? <Loading /> : null}
        {problems.isError ? <ErrorState message={(problems.error as Error).message} onRetry={() => problems.refetch()} /> : null}
        {problems.isSuccess && list.length === 0 ? (
          <Body muted>No problems raised here yet. What do people here struggle with?</Body>
        ) : null}
        {list.map((p) => (
          <ProblemCard key={p.id} problem={p} countryLabel={countryLabel(p.country)} faced={isFaced(p.id)} onFace={(id) => face.mutate(id)} />
        ))}
      </View>

      <View style={{ gap: space.md }}>
        <SectionTitle eyebrow="What got solved here" title="Unicorns" />
        {unicorns.isLoading ? <Loading /> : null}
        {unicorns.isSuccess && unicorns.data?.companies.length === 0 ? <Body muted>No unicorns on Atlas here yet.</Body> : null}
        {(unicorns.data?.companies || []).map((s) => (
          <StartupRow key={s.id} startup={s} />
        ))}
        {c?.companies ? (
          <Button
            title={`All ${num(c.companies)} startups in ${countryLabel(name)}`}
            variant="ghost"
            icon="arrow-right"
            onPress={() => router.push({ pathname: '/startups', params: { country: name } })}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
