import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { host, label, num, timeAgo } from '../format';
import { colors, fonts, radius, space } from '../theme';
import type { Builder, Comment, Job, Meta, ReportKind, Startup, Story } from '../types';
import { Body, Label, Pill } from './ui';

export const openUrl = (url?: string | null) => {
  if (url) WebBrowser.openBrowserAsync(url, { controlsColor: colors.ink, toolbarColor: colors.paper }).catch(() => {});
};

export function reportItem(kind: ReportKind, id: number, problemId?: number) {
  router.push({ pathname: '/report', params: { kind, id: String(id), problem: problemId ? String(problemId) : '' } });
}

function More({ kind, id, problemId }: { kind: ReportKind; id: number; problemId?: number }) {
  return (
    <Pressable onPress={() => reportItem(kind, id, problemId)} hitSlop={10} accessibilityLabel="Report">
      <Feather name="flag" size={14} color={colors.ink3} />
    </Pressable>
  );
}

// ---- Evidence bars ("how often", "would pay", "who it hits")

export function Bars({ title, options, counts, total, color }: { title: string; options: [string, string][]; counts: Record<string, number>; total: number; color: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{title}</Label>
      {options.map(([k, l]) => {
        const n = counts[k] || 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        return (
          <View key={k}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={d.barLabel} numberOfLines={1}>{l}</Text>
              <Text style={d.barPct}>{pct}%</Text>
            </View>
            <View style={d.track}>
              <View style={[d.fill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function StoryItem({ story, meta, problemId }: { story: Story; meta: Meta; problemId: number }) {
  return (
    <View style={d.item}>
      <View style={d.itemHead}>
        <Label style={{ flex: 1 }} numberOfLines={1}>
          {story.author || 'Anonymous'}
          {story.city ? ` · ${story.city}` : ''} · {timeAgo(story.created_at)}
        </Label>
        <More kind="story" id={story.id} problemId={problemId} />
      </View>
      <Body style={{ marginTop: 4 }}>“{story.story}”</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        <Pill text={label(meta.proof.frequency, story.frequency)} />
        <Pill text={label(meta.proof.who, story.who)} />
        {story.pay !== 'none' ? <Pill text="Would pay" bg={colors.mossSoft} color={colors.moss} /> : null}
      </View>
    </View>
  );
}

export function StartupRow({ startup }: { startup: Startup }) {
  return (
    <Pressable
      onPress={() => openUrl(startup.website)}
      disabled={!startup.website}
      style={({ pressed }) => [d.item, pressed && { opacity: 0.85 }]}
    >
      <View style={d.itemHead}>
        <Text style={d.name} numberOfLines={1}>
          {startup.name}
        </Text>
        {startup.is_unicorn ? <Pill text="🦄 Unicorn" bg={colors.signalSoft} color={colors.signal} /> : null}
        {startup.linked ? <Pill text="Added by people" /> : null}
      </View>
      <Label style={{ marginTop: 2 }} numberOfLines={1}>
        {startup.industry} · {startup.city ? `${startup.city}, ` : ''}
        {startup.country}
      </Label>
      <Body muted numberOfLines={2} style={{ marginTop: 4, fontSize: 14, lineHeight: 20 }}>
        {startup.problem}
      </Body>
      {startup.website ? (
        <Text style={d.link} numberOfLines={1}>
          {host(startup.website)} ↗
        </Text>
      ) : null}
    </Pressable>
  );
}

export function BuilderCard({ builder, meta, showProblem }: { builder: Builder; meta: Meta; showProblem?: boolean }) {
  const needs = (builder.needs || '').split(',').filter(Boolean);
  const updates = Array.isArray(builder.updates) ? builder.updates : [];
  const updateCount = Array.isArray(builder.updates) ? builder.updates.length : builder.updates || 0;
  return (
    <View style={[d.item, builder.studio_pick && { borderColor: colors.signal }]}>
      <View style={d.itemHead}>
        <View style={d.avatar}>
          <Text style={d.avatarText}>{builder.first_name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={d.name}>
            {builder.first_name}
            {builder.mine ? ' (you)' : ''}
          </Text>
          <Label numberOfLines={1}>
            {builder.city ? `${builder.city} · ` : ''}
            {label(meta.builder.stages, builder.stage)}
          </Label>
        </View>
        {builder.studio_pick ? <Pill text="★ Studio pick" bg={colors.signal} color={colors.white} /> : null}
        <More kind="builder" id={builder.id} problemId={builder.problem_id} />
      </View>
      {builder.headline ? <Body style={{ marginTop: 8 }}>{builder.headline}</Body> : null}
      {showProblem && builder.problem ? (
        <Pressable onPress={() => router.push(`/problem/${builder.problem_id}`)}>
          <Text style={[d.link, { marginTop: 6 }]} numberOfLines={2}>
            Building: {builder.problem} →
          </Text>
        </Pressable>
      ) : null}
      {needs.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {needs.map((n) => (
            <Pill key={n} text={`Needs ${label(meta.builder.needs, n).toLowerCase()}`} />
          ))}
        </View>
      ) : null}
      {!builder.mine ? (
        <Pressable
          onPress={() => router.push({ pathname: '/intro/[id]', params: { id: String(builder.id), name: builder.first_name } })}
          hitSlop={6}
        >
          <Text style={d.link}>Ask for an intro →</Text>
        </Pressable>
      ) : null}
      {updates[0] ? (
        <View style={d.update}>
          <Label style={{ fontSize: 10 }}>Latest update · {timeAgo(updates[0].created_at)}</Label>
          <Body style={{ marginTop: 2, fontSize: 14, lineHeight: 20 }}>{updates[0].body}</Body>
        </View>
      ) : updateCount ? (
        <Label style={{ marginTop: 8, fontSize: 10 }}>{num(updateCount)} progress updates</Label>
      ) : null}
    </View>
  );
}

export function CommentItem({
  comment,
  problemId,
  helped,
  onHelpful,
}: {
  comment: Comment;
  problemId: number;
  helped: boolean;
  onHelpful: (id: number) => void;
}) {
  return (
    <View style={d.item}>
      <View style={d.itemHead}>
        <Pill text={comment.kind === 'solution' ? 'Idea' : 'Comment'} bg={comment.kind === 'solution' ? colors.mossSoft : colors.paper2} color={comment.kind === 'solution' ? colors.moss : colors.ink2} />
        <Label style={{ flex: 1 }} numberOfLines={1}>
          {comment.author || 'Anonymous'} · {timeAgo(comment.created_at)}
        </Label>
        <More kind="comment" id={comment.id} problemId={problemId} />
      </View>
      <Body style={{ marginTop: 6 }}>{comment.body}</Body>
      <Pressable
        onPress={() => !helped && onHelpful(comment.id)}
        hitSlop={8}
        style={[d.helpful, helped && { borderColor: colors.moss, backgroundColor: colors.mossSoft }]}
        accessibilityRole="button"
        accessibilityLabel="Mark helpful"
      >
        <Feather name="thumbs-up" size={13} color={helped ? colors.moss : colors.ink2} />
        <Text style={[d.helpfulText, helped && { color: colors.moss }]}>
          Helpful{comment.helpful ? ` · ${num(comment.helpful)}` : ''}
        </Text>
      </Pressable>
    </View>
  );
}

export function JobRow({ job, showProblem }: { job: Job; showProblem?: boolean }) {
  return (
    <View style={d.item}>
      <Text style={d.name}>{job.title}</Text>
      <Label style={{ marginTop: 2 }} numberOfLines={1}>
        {job.company}
        {job.location ? ` · ${job.location}` : ''}
      </Label>
      {job.focus ? <Body muted style={{ marginTop: 6, fontSize: 14, lineHeight: 20 }}>{job.focus}</Body> : null}
      {showProblem && job.problem && job.problem_id ? (
        <Pressable onPress={() => router.push(`/problem/${job.problem_id}`)}>
          <Text style={[d.link, { marginTop: 6 }]} numberOfLines={2}>
            Solves: {job.problem} →
          </Text>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <Pill text={job.source} />
        <Pressable onPress={() => openUrl(job.url)} style={({ pressed }) => [d.apply, pressed && { opacity: 0.85 }]}>
          <Text style={d.applyText}>Apply ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const d = StyleSheet.create({
  item: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md + 2,
  },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, flexShrink: 1 },
  link: { fontFamily: fonts.semibold, fontSize: 13, color: colors.signal, marginTop: 6 },
  barLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, flex: 1 },
  barPct: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink2 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.paper2, marginTop: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.display, fontSize: 16, color: colors.paper },
  update: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  helpful: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    height: 28,
  },
  helpfulText: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink2 },
  apply: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 16, height: 36, justifyContent: 'center' },
  applyText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.paper },
});
