import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, links, SITE_URL } from '@/api';
import { openUrl } from '@/components/detail';
import { Field, FormError } from '@/components/form';
import { Body, Button, Card, Display, Label, Loading, StageBadge, Stat } from '@/components/ui';
import { num, plural } from '@/format';
import { useCountryLabel, useMe, useMeta } from '@/hooks';
import { clearHidden, getRefCode, setRefCode, useHidden, validRefCode } from '@/store';
import { colors, fonts, radius, space } from '@/theme';
import type { ProblemSummary } from '@/types';

// "My Atlas": your invite link, what you raised, what you face, what you're
// building. No account: it belongs to this phone.
export default function MeScreen() {
  const meta = useMeta();
  const me = useMe();
  const countryLabel = useCountryLabel();
  const qc = useQueryClient();
  const { count: hiddenCount } = useHidden();
  const [name, setName] = useState('');
  const [ref, setRef] = useState<string | null>(null);
  const [refDraft, setRefDraft] = useState('');

  useEffect(() => {
    getRefCode().then(setRef);
  }, []);

  const createInvite = useMutation({
    mutationFn: () => api.createInvite(name.trim()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const invite = me.data?.invite;
  const raised = me.data?.raised || [];
  const faced = me.data?.faced || [];
  const builds = me.data?.builds || [];

  const shareInvite = () =>
    invite &&
    Share.share({
      message: `I'm mapping the problems people face on Atlas, and who is solving them. Add yours or say which ones you face: ${links.invite(invite.code)}`,
      url: links.invite(invite.code),
    }).catch(() => {});

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: space.lg, paddingBottom: 80, gap: space.xl }}
        refreshControl={<RefreshControl refreshing={me.isRefetching} onRefresh={() => me.refetch()} tintColor={colors.ink} />}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Label>My Atlas</Label>
          <Display size={27} style={{ marginTop: 4 }}>Your problems, your stories, your invites.</Display>
          <Body muted style={{ marginTop: 4, fontSize: 14 }}>No account needed. This is tied to this phone.</Body>
        </View>

        {/* Invite */}
        <Card tone="ink">
          <Text style={st.inkLabel}>Invite people</Text>
          {invite ? (
            <>
              <Text style={st.code}>{invite.code}</Text>
              <Text style={st.inkBody}>{links.invite(invite.code).replace('https://', '')}</Text>
              <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.md }}>
                <InkStat value={num(invite.visits)} label="Visits" />
                <InkStat value={num(invite.joined)} label="Joined" />
                <InkStat value={num(invite.problems)} label="Problems" />
              </View>
              <Button title="Share my link" variant="signal" icon="share" style={{ marginTop: space.lg }} onPress={shareInvite} />
            </>
          ) : (
            <>
              <Text style={[st.inkBody, { marginTop: 4 }]}>
                Get a personal link. Visits, people who join and problems they add are credited to you.
              </Text>
              <View style={{ marginTop: space.md, gap: space.sm }}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={60}
                  placeholder="Your name (shown to people you invite)"
                  placeholderTextColor={colors.ink3}
                  style={st.inkInput}
                />
                <FormError message={createInvite.isError ? (createInvite.error as Error).message : null} />
                <Button title="Get my invite link" variant="signal" onPress={() => createInvite.mutate()} busy={createInvite.isPending} disabled={name.trim().length < 2} />
              </View>
            </>
          )}
        </Card>

        {me.isLoading ? <Loading /> : null}

        <View style={st.statsRow}>
          <Stat value={num(raised.length)} label="Raised" />
          <Stat value={num(faced.length)} label="Facing" />
          <Stat value={num(builds.length)} label="Building" />
        </View>

        <ProblemList title="Problems you raised" empty="You haven't added a problem yet." items={raised} countryLabel={countryLabel}>
          <Button title="Add a problem" icon="plus" small onPress={() => router.push('/submit')} style={{ alignSelf: 'flex-start' }} />
        </ProblemList>
        <ProblemList title="Problems you face" empty="Tap “I face this” on any problem you have." items={faced} countryLabel={countryLabel} />

        {builds.length ? (
          <View style={{ gap: space.sm }}>
            <Label>What you're building</Label>
            {builds.map((b) => (
              <Pressable key={b.id} onPress={() => router.push(`/problem/${b.problem_id}`)} style={({ pressed }) => [st.row, pressed && { opacity: 0.85 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={st.rowTitle} numberOfLines={2}>{b.problem}</Text>
                  <Label style={{ fontSize: 10, marginTop: 2 }}>
                    {meta.builder.stages.find(([k]) => k === b.stage)?.[1] || b.stage} · {b.is_public ? 'public card' : 'private'} · {b.status}
                  </Label>
                </View>
                <Feather name="chevron-right" size={16} color={colors.ink3} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Invited by someone? */}
        <Card>
          <Label>Were you invited?</Label>
          {ref ? (
            <Body style={{ marginTop: 6 }}>
              You joined with code <Text style={{ fontFamily: fonts.mono }}>{ref}</Text>. Thanks for coming.
            </Body>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: space.sm, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Field label="Invite code" required max={6} value={refDraft} onChangeText={(t: string) => setRefDraft(t.toUpperCase())} autoCapitalize="characters" autoCorrect={false} placeholder="ABC123" />
              </View>
              <Button
                title="Save"
                small
                style={{ minHeight: 46 }}
                disabled={!validRefCode(refDraft)}
                onPress={async () => {
                  if (await setRefCode(refDraft)) setRef(refDraft.trim().toUpperCase());
                }}
              />
            </View>
          )}
        </Card>

        {/* More */}
        <View style={{ gap: space.sm }}>
          <Label>More</Label>
          <LinkRow icon="users" title="Builders board" onPress={() => router.push('/builders')} />
          <LinkRow icon="star" title={`The ${meta.site.parent} studio`} onPress={() => openUrl(meta.links.studio)} external />
          <LinkRow icon="info" title={`About ${meta.site.parent}`} onPress={() => openUrl(meta.links.about)} external />
          <LinkRow icon="globe" title="atlaselevatr.in" onPress={() => openUrl(SITE_URL)} external />
          <LinkRow icon="shield" title="Privacy" onPress={() => openUrl(meta.links.privacy)} external />
          <LinkRow icon="mail" title={`Contact: ${meta.links.contact}`} onPress={() => Linking.openURL(`mailto:${meta.links.contact}`).catch(() => {})} external />
          {hiddenCount ? (
            <LinkRow
              icon="eye"
              title={`Show ${plural(hiddenCount, 'item', 'items')} you reported`}
              onPress={() =>
                Alert.alert('Show reported items again?', 'They will reappear for you. Your reports still stand.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Show them', onPress: () => clearHidden() },
                ])
              }
            />
          ) : null}
        </View>

        <Label style={{ textAlign: 'center' }}>
          Atlas {Constants.expoConfig?.version || ''} · {meta.site.parent}
        </Label>
      </ScrollView>
    </SafeAreaView>
  );
}

function InkStat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.paper }}>{value}</Text>
      <Text style={st.inkLabel}>{label}</Text>
    </View>
  );
}

function ProblemList({
  title,
  empty,
  items,
  countryLabel,
  children,
}: {
  title: string;
  empty: string;
  items: ProblemSummary[];
  countryLabel: (n: string) => string;
  children?: ReactNode;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Label>{title}</Label>
      {items.length === 0 ? <Body muted>{empty}</Body> : null}
      {items.slice(0, 20).map((p) => (
        <Pressable key={p.id} onPress={() => router.push(`/problem/${p.id}`)} style={({ pressed }) => [st.row, pressed && { opacity: 0.85 }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <StageBadge stage={p.stage} />
            <Text style={st.rowTitle} numberOfLines={2}>{p.title}</Text>
            <Label style={{ fontSize: 10 }}>
              {countryLabel(p.country)} · {num(p.votes)} face it · {num(p.proofs || 0)} stories
            </Label>
          </View>
          <Feather name="chevron-right" size={16} color={colors.ink3} />
        </Pressable>
      ))}
      {children}
    </View>
  );
}

function LinkRow({ icon, title, onPress, external }: { icon: ComponentProps<typeof Feather>['name']; title: string; onPress: () => void; external?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.row, pressed && { opacity: 0.85 }]}>
      <Feather name={icon} size={17} color={colors.ink} />
      <Text style={[st.rowTitle, { flex: 1 }]} numberOfLines={1}>{title}</Text>
      <Feather name={external ? 'external-link' : 'chevron-right'} size={15} color={colors.ink3} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  inkLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(244,241,234,0.7)' },
  inkBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: 'rgba(244,241,234,0.85)' },
  code: { fontFamily: fonts.mono, fontSize: 34, letterSpacing: 6, color: colors.paper, marginTop: space.sm },
  inkInput: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    height: 46,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
