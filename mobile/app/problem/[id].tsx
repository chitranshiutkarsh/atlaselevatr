import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { type ComponentProps, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, links } from '@/api';
import { Bars, BuilderCard, CommentItem, JobRow, openUrl, reportItem, StartupRow, StoryItem } from '@/components/detail';
import { FormError } from '@/components/form';
import { Body, Button, Card, Display, ErrorState, Label, Loading, SectionTitle, StageBadge } from '@/components/ui';
import { num, plural } from '@/format';
import { useFace, useMe, useMeta } from '@/hooks';
import { shouldCountView, useHidden } from '@/store';
import { colors, fonts, radius, space } from '@/theme';
import type { ProblemDetail } from '@/types';

const VERDICT: Record<string, { tone: 'moss' | undefined; icon: ComponentProps<typeof Feather>['name'] }> = {
  open: { tone: 'moss', icon: 'sunrise' },
  gap: { tone: 'moss', icon: 'map-pin' },
  thin: { tone: undefined, icon: 'bar-chart-2' },
  crowded: { tone: undefined, icon: 'users' },
};

export default function ProblemScreen() {
  const params = useLocalSearchParams<{ id: string; new?: string }>();
  const id = parseInt(params.id, 10);
  const meta = useMeta();
  const me = useMe();
  const qc = useQueryClient();
  const face = useFace();
  const { isHidden } = useHidden();
  const [allStories, setAllStories] = useState(false);

  const q = useQuery({ queryKey: ['problem', id], queryFn: () => api.problem(id), enabled: id > 0 });

  useEffect(() => {
    if (!(id > 0)) return;
    shouldCountView(id).then((yes) => {
      if (yes) api.view(id).catch(() => {});
    });
  }, [id]);

  const helpful = useMutation({
    mutationFn: (commentId: number) => api.helpful(commentId),
    onMutate: (commentId) =>
      qc.setQueryData<ProblemDetail>(['problem', id], (d) =>
        d
          ? {
              ...d,
              me: { ...d.me, helped: [...d.me.helped, commentId] },
              comments: d.comments.map((c) => (c.id === commentId ? { ...c, helpful: c.helpful + 1 } : c)),
            }
          : d
      ),
    onError: () => qc.invalidateQueries({ queryKey: ['problem', id] }),
  });

  if (!(id > 0)) return <ErrorState message="This problem link is not valid." />;
  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <ErrorState message={(q.error as Error)?.message} onRetry={() => q.refetch()} />;

  const { problem: p, proof, comments, builders, startups, jobs, me: mine } = q.data;
  const toGo = Math.max(0, meta.validation.proofs - proof.total);
  const progress = Math.min(1, proof.total / meta.validation.proofs);
  const stories = proof.stories.filter((s) => !isHidden('story', s.id));
  const shownStories = allStories ? stories : stories.slice(0, 3);
  const visibleComments = comments.filter((c) => !isHidden('comment', c.id));
  const visibleBuilders = builders.filter((b) => !isHidden('builder', b.id));
  const ref = me.data?.invite?.code || null;
  const verdict = startups?.verdict;
  const startupList = startups ? [...startups.local, ...startups.world].slice(0, 6) : [];

  const share = () =>
    Share.share({
      message: `${p.title}\n\nDo you face this too? Say so on Atlas: ${links.problem(p.id, ref)}`,
      url: links.problem(p.id, ref),
    }).catch(() => {});

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
              <Pressable onPress={share} hitSlop={10} accessibilityLabel="Share">
                <Feather name="share" size={20} color={colors.ink} />
              </Pressable>
              <Pressable onPress={() => reportItem('problem', p.id, p.id)} hitSlop={10} accessibilityLabel="Report this problem">
                <Feather name="flag" size={19} color={colors.ink} />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: 80, gap: space.xl }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.ink} />}
        keyboardShouldPersistTaps="handled"
      >
        {params.new === '1' ? (
          <Card tone="moss">
            <Label color={colors.moss}>Live now</Label>
            <Display size={20} style={{ marginTop: 4 }}>Your problem is on the map.</Display>
            <Body muted style={{ marginTop: 4 }}>
              Next: get people who face it to say so. {meta.validation.proofs} first-hand stories validate it for founders. Share it with them.
            </Body>
            <Button title="Share it" icon="share" small style={{ marginTop: space.md, alignSelf: 'flex-start' }} onPress={share} />
          </Card>
        ) : null}

        {/* The problem */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StageBadge stage={p.stage} />
            <Label style={{ flexShrink: 1 }} numberOfLines={2}>
              {p.industry} · {p.country_label}
              {p.author ? ` · raised by ${p.author}` : ''}
            </Label>
          </View>
          <Display size={28} style={{ marginTop: space.md }}>{p.title}</Display>
          {p.details ? <Body muted style={{ marginTop: space.sm, fontSize: 16, lineHeight: 24 }}>{p.details}</Body> : null}
          {p.source ? (
            <Pressable onPress={() => openUrl(p.source_url)} disabled={!p.source_url}>
              <Label style={{ marginTop: space.md }}>Source: {p.source}{p.source_url ? ' ↗' : ''}</Label>
            </Pressable>
          ) : null}
          <Label style={{ marginTop: 6, fontSize: 10 }}>{num(p.views || 0)} views</Label>
        </View>

        {/* Face it → validate */}
        <Card>
          <Label>Do you face this?</Label>
          <Display size={22} style={{ marginTop: 4 }}>
            {p.votes === 0 ? 'Be the first to say you face this' : `${num(p.votes)} ${p.votes === 1 ? 'person faces' : 'people face'} this`}
          </Display>
          <Body muted style={{ marginTop: 4, fontSize: 14 }}>
            {plural(proof.total, 'first-hand story', 'first-hand stories')}.{' '}
            {toGo > 0 ? `${toGo} more ${toGo === 1 ? 'story validates' : 'stories validate'} it for founders.` : 'Validated: ready for a builder.'}
          </Body>
          <View style={st.progress}>
            <View style={[st.progressFill, { width: `${progress * 100}%`, backgroundColor: toGo ? colors.signal : colors.moss }]} />
          </View>
          <View style={{ gap: space.sm, marginTop: space.lg }}>
            {!mine.voted ? (
              <Button title="I face this" icon="plus" onPress={() => face.mutate(id, { onSuccess: () => router.push(`/story/${id}`) })} busy={face.isPending} />
            ) : (
              <View style={st.facedRow}>
                <Feather name="check-circle" size={18} color={colors.moss} />
                <Text style={st.facedText}>{mine.storied ? 'You face this, and your story is in.' : 'You face this.'}</Text>
              </View>
            )}
            {mine.voted && !mine.storied ? (
              <Button title="Add your one-line story" variant="ghost" icon="edit-3" onPress={() => router.push(`/story/${id}`)} />
            ) : null}
            {face.isError ? <FormError message={(face.error as Error).message} /> : null}
          </View>
        </Card>

        {proof.total > 0 ? (
          <View style={{ gap: space.md }}>
            <SectionTitle eyebrow="The evidence" title="What people say" />
            <Card style={{ gap: space.lg }}>
              <Bars title="How often" options={meta.proof.frequency} counts={proof.frequency} total={proof.total} color={colors.ink} />
              <Bars title="Would pay for a fix" options={meta.proof.pay} counts={proof.pay} total={proof.total} color={colors.moss} />
              <Bars title="Who it hits" options={meta.proof.who} counts={proof.who} total={proof.total} color={colors.signal} />
            </Card>
            {shownStories.map((s) => (
              <StoryItem key={s.id} story={s} meta={meta} problemId={id} />
            ))}
            {stories.length > 3 ? (
              <Button title={allStories ? 'Show fewer' : `Show all ${stories.length} stories`} variant="ghost" small onPress={() => setAllStories((v) => !v)} />
            ) : null}
          </View>
        ) : null}

        {/* Gap check: who is already solving it */}
        <View style={{ gap: space.md }}>
          <SectionTitle eyebrow="Gap check" title="Who's solving this" />
          {verdict ? (
            <Card tone={VERDICT[verdict.kind]?.tone}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name={VERDICT[verdict.kind]?.icon || 'info'} size={16} color={verdict.kind === 'open' || verdict.kind === 'gap' ? colors.moss : colors.ink} />
                <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: colors.ink }}>{verdict.label}</Text>
              </View>
              <Body muted style={{ marginTop: 4 }}>{verdict.text}</Body>
            </Card>
          ) : (
            <Body muted>We could not check startups for this one right now.</Body>
          )}
          {startupList.map((s) => (
            <StartupRow key={s.id} startup={s} />
          ))}
          {startups && startups.totals.world > startupList.length ? (
            <Button title={`See all ${num(startups.totals.world)} on the web`} variant="ghost" small icon="external-link" onPress={() => openUrl(links.startupsFor(id))} />
          ) : null}
        </View>

        {/* Claim → studio */}
        <View style={{ gap: space.md }}>
          <SectionTitle eyebrow="Build it" title={visibleBuilders.length ? `${plural(visibleBuilders.length, 'builder', 'builders')} on it` : 'No one is building this yet'} />
          {visibleBuilders.map((b) => (
            <BuilderCard key={b.id} builder={b} meta={meta} />
          ))}
          <Card tone="ink">
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.paper }}>Want to build this?</Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: 'rgba(244,241,234,0.8)', marginTop: 4 }}>
              Tell the {meta.site.parent} team where you are with it. The best builders get studio support: validation, product, customers and funding.
            </Text>
            <Button title="I want to build this" variant="signal" icon="tool" style={{ marginTop: space.md }} onPress={() => router.push(`/build/${id}`)} />
          </Card>
        </View>

        {/* Ideas and comments */}
        <View style={{ gap: space.md }}>
          <SectionTitle
            eyebrow="How to solve it"
            title="Ideas"
            right={<Button title="Add yours" small variant="ghost" icon="plus" onPress={() => router.push(`/suggest/${id}`)} />}
          />
          {p.solution ? (
            <View style={[st.pinned]}>
              <Label>Pinned · the raiser's idea</Label>
              <Body style={{ marginTop: 4 }}>{p.solution}</Body>
            </View>
          ) : null}
          {visibleComments.length === 0 && !p.solution ? <Body muted>No ideas yet. How would you solve it?</Body> : null}
          {visibleComments.map((c) => (
            <CommentItem key={c.id} comment={c} problemId={id} helped={mine.helped.includes(c.id)} onHelpful={(cid) => helpful.mutate(cid)} />
          ))}
        </View>

        {jobs.length ? (
          <View style={{ gap: space.md }}>
            <SectionTitle eyebrow="Get paid to solve it" title="Jobs" />
            {jobs.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </View>
        ) : null}

        <FollowBox problemId={id} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FollowBox({ problemId }: { problemId: number }) {
  const [email, setEmail] = useState('');
  const follow = useMutation({ mutationFn: () => api.follow(problemId, email.trim()) });
  return (
    <Card>
      <Label>Follow this problem</Label>
      <Body muted style={{ marginTop: 4, fontSize: 14 }}>Get an email when someone claims it or suggests a fix. Nothing else.</Body>
      {follow.isSuccess ? (
        <View style={[st.facedRow, { marginTop: space.md }]}>
          <Feather name="check-circle" size={18} color={colors.moss} />
          <Text style={st.facedText}>You're following it.</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: space.md }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={colors.ink3}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={st.input}
          />
          <Button title="Follow" small onPress={() => follow.mutate()} busy={follow.isPending} disabled={!/^\S+@\S+\.\S{2,}$/.test(email.trim())} />
        </View>
      )}
      {follow.isError ? <View style={{ marginTop: space.sm }}><FormError message={(follow.error as Error).message} /></View> : null}
    </Card>
  );
}

const st = StyleSheet.create({
  progress: { height: 6, borderRadius: 3, backgroundColor: colors.paper2, marginTop: space.md, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  facedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  facedText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.moss, flexShrink: 1 },
  pinned: {
    borderLeftWidth: 3,
    borderLeftColor: colors.signal,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: space.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,33,61,0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    height: 40,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
});

