import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps, memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { num } from '../format';
import { colors, fonts, radius, space } from '../theme';
import type { ProblemSummary, Stage } from '../types';
import { Body, Label, Pill, StageBadge } from './ui';

function stageOf(p: ProblemSummary): Stage {
  if (p.stage) return p.stage;
  if (p.studio) return 'studio';
  if ((p.builders || 0) >= 1) return 'claimed';
  if ((p.proofs || 0) >= 10) return 'validated';
  return 'open';
}

const VERDICT_TONE: Record<string, { bg: string; fg: string }> = {
  open: { bg: colors.mossSoft, fg: colors.moss },
  gap: { bg: colors.mossSoft, fg: colors.moss },
  thin: { bg: colors.paper2, fg: colors.ink },
  crowded: { bg: colors.paper2, fg: colors.ink2 },
};

type Props = {
  problem: ProblemSummary;
  countryLabel: string;
  faced: boolean;
  onFace?: (id: number) => void;
  rank?: number;
};

function ProblemCardInner({ problem: p, countryLabel, faced, onFace, rank }: Props) {
  const verdict = p.verdict ? VERDICT_TONE[p.verdict.kind] : null;
  return (
    <Pressable
      onPress={() => router.push(`/problem/${p.id}`)}
      style={({ pressed }) => [st.card, pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] }]}
      accessibilityRole="button"
      accessibilityLabel={p.title}
    >
      <View style={st.top}>
        {rank ? <Text style={st.rank}>{rank}</Text> : null}
        <StageBadge stage={stageOf(p)} />
        {p.verdict && verdict ? <Pill text={p.verdict.label} bg={verdict.bg} color={verdict.fg} /> : null}
      </View>
      <Label style={{ marginTop: 10 }} numberOfLines={1}>
        {p.industry} · {countryLabel}
      </Label>
      <Text style={st.title} numberOfLines={3}>
        {p.title}
      </Text>
      {p.details ? (
        <Body muted numberOfLines={2} style={{ marginTop: 4, fontSize: 14, lineHeight: 20 }}>
          {p.details}
        </Body>
      ) : null}
      <View style={st.foot}>
        <View style={st.metrics}>
          <Metric icon="users" value={p.votes} />
          {p.proofs ? <Metric icon="message-circle" value={p.proofs} label="stories" /> : null}
          {p.builders ? <Metric icon="tool" value={p.builders} label={p.builders === 1 ? 'builder' : 'builders'} /> : null}
        </View>
        {onFace ? (
          <Pressable
            onPress={() => !faced && onFace(p.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={faced ? 'You face this' : 'I face this'}
            style={({ pressed }) => [st.face, faced && st.faceOn, pressed && { opacity: 0.8 }]}
          >
            <Feather name={faced ? 'check' : 'plus'} size={14} color={faced ? colors.white : colors.ink} />
            <Text style={[st.faceText, faced && { color: colors.white }]}>{faced ? 'You face this' : 'I face this'}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function Metric({ icon, value, label }: { icon: ComponentProps<typeof Feather>['name']; value: number; label?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Feather name={icon} size={13} color={colors.ink2} />
      <Text style={st.metric}>
        {num(value)}
        {label ? ` ${label}` : ''}
      </Text>
    </View>
  );
}

export const ProblemCard = memo(ProblemCardInner);

const st = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.lg,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rank: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink3, marginRight: 2 },
  title: { fontFamily: fonts.display, fontSize: 19, lineHeight: 24, color: colors.ink, marginTop: 4, letterSpacing: -0.2 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md, gap: space.sm },
  metrics: { flexDirection: 'row', gap: space.md, flexShrink: 1, flexWrap: 'wrap' },
  metric: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink2 },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  faceOn: { backgroundColor: colors.moss, borderColor: colors.moss },
  faceText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
});
