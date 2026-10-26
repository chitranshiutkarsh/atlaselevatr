import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { colors, fonts, radius, space } from '../theme';
import type { Stage } from '../types';

// ---- Text

export function Display({ style, size = 28, ...p }: TextProps & { size?: number }) {
  return <Text {...p} style={[{ fontFamily: fonts.display, fontSize: size, lineHeight: Math.round(size * 1.18), color: colors.ink, letterSpacing: -0.3 }, style]} />;
}

export function Body({ style, muted, ...p }: TextProps & { muted?: boolean }) {
  return <Text {...p} style={[{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: muted ? colors.ink2 : colors.ink }, style]} />;
}

export function Strong({ style, ...p }: TextProps) {
  return <Text {...p} style={[{ fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.ink }, style]} />;
}

// Small uppercase mono label, like the ".label" style on the website.
export function Label({ style, color, ...p }: TextProps & { color?: string }) {
  return (
    <Text
      {...p}
      style={[{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: color || colors.ink2 }, style]}
    />
  );
}

// ---- Surfaces

export function Card({ children, style, tone }: { children: ReactNode; style?: ViewStyle | ViewStyle[]; tone?: 'moss' | 'signal' | 'ink' }) {
  const toneStyle: ViewStyle | undefined =
    tone === 'moss'
      ? { borderColor: colors.moss, backgroundColor: colors.mossSoft }
      : tone === 'signal'
        ? { borderColor: colors.signal, backgroundColor: colors.signalSoft }
        : tone === 'ink'
          ? { borderColor: colors.ink, backgroundColor: colors.ink }
          : undefined;
  return <View style={[s.card, toneStyle, style as ViewStyle]}>{children}</View>;
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong }, style]} />;
}

// Faint survey-map grid behind headers, like the website's background.
export function Graticule({ height = 220 }: { height?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
      <Svg width="100%" height={height}>
        <Defs>
          <Pattern id="grid" width={36} height={36} patternUnits="userSpaceOnUse">
            <Path d="M 36 0 L 0 0 0 36" fill="none" stroke={colors.ink} strokeOpacity={0.06} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
    </View>
  );
}

// ---- Buttons and chips

type BtnProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'ghost' | 'signal' | 'moss' | 'link';
  icon?: ComponentProps<typeof Feather>['name'];
  busy?: boolean;
  small?: boolean;
  style?: ViewStyle;
};

export function Button({ title, variant = 'primary', icon, busy, small, disabled, style, ...p }: BtnProps) {
  const palette: Record<string, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.ink, fg: colors.paper, border: colors.ink },
    signal: { bg: colors.signal, fg: colors.white, border: colors.signal },
    moss: { bg: colors.moss, fg: colors.white, border: colors.moss },
    ghost: { bg: 'transparent', fg: colors.ink, border: colors.lineStrong },
    link: { bg: 'transparent', fg: colors.signal, border: 'transparent' },
  };
  const c = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      {...p}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        variant === 'link' && { paddingHorizontal: 0 },
        { backgroundColor: c.bg, borderColor: c.border, opacity: disabled ? 0.45 : pressed ? 0.82 : 1 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={c.fg} size="small" />
      ) : (
        <>
          {icon && <Feather name={icon} size={small ? 14 : 16} color={c.fg} />}
          <Text style={[s.btnText, small && { fontSize: 13 }, { color: c.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({ label, on, onPress, icon, style }: { label: string; on?: boolean; onPress?: () => void; icon?: ComponentProps<typeof Feather>['name']; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      style={({ pressed }) => [s.chip, on && s.chipOn, pressed && { opacity: 0.8 }, style]}
    >
      {icon && <Feather name={icon} size={12} color={on ? colors.paper : colors.ink2} />}
      <Text style={[s.chipText, on && { color: colors.paper }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---- Stage badge: Open → Validated → Claimed → In studio

const STAGE_STYLE: Record<Stage, { bg: string; fg: string; border: string; icon: string; label: string }> = {
  open: { bg: colors.paper, fg: colors.ink2, border: colors.lineStrong, icon: '○', label: 'Open' },
  validated: { bg: colors.moss, fg: colors.white, border: colors.moss, icon: '✓', label: 'Validated' },
  claimed: { bg: colors.ink, fg: colors.paper, border: colors.ink, icon: '↗', label: 'Claimed' },
  studio: { bg: colors.signal, fg: colors.white, border: colors.signal, icon: '★', label: 'In studio' },
};

export function StageBadge({ stage, hideOpen }: { stage?: Stage; hideOpen?: boolean }) {
  const key = stage || 'open';
  if (key === 'open' && hideOpen) return null;
  const st = STAGE_STYLE[key];
  return (
    <View style={[s.badge, { backgroundColor: st.bg, borderColor: st.border }]}>
      <Text style={[s.badgeText, { color: st.fg }]}>
        {st.icon} {st.label}
      </Text>
    </View>
  );
}

export function Pill({ text, color = colors.ink2, bg = colors.paper2 }: { text: string; color?: string; bg?: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg, borderColor: 'transparent' }]}>
      <Text style={[s.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

// ---- States

export function Loading({ label }: { label?: string }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.ink} />
      {label ? <Body muted style={{ marginTop: space.md }}>{label}</Body> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={s.center}>
      <Feather name="wifi-off" size={22} color={colors.ink2} />
      <Body muted style={{ marginTop: space.md, textAlign: 'center' }}>
        {message || 'Something went wrong.'}
      </Body>
      {onRetry && <Button title="Try again" variant="ghost" small onPress={onRetry} style={{ marginTop: space.lg }} />}
    </View>
  );
}

export function Empty({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <View style={[s.center, { paddingVertical: space.xxl }]}>
      <Display size={20} style={{ textAlign: 'center' }}>{title}</Display>
      {body ? <Body muted style={{ marginTop: space.sm, textAlign: 'center' }}>{body}</Body> : null}
      {children}
    </View>
  );
}

export function SectionTitle({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md }}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Label>{eyebrow}</Label> : null}
        <Display size={22} style={{ marginTop: 2 }}>{title}</Display>
      </View>
      {right}
    </View>
  );
}

export function Stat({ value, label: text, style }: { value: string; label: string; style?: TextStyle }) {
  return (
    <View style={{ minWidth: 70 }}>
      <Text style={[{ fontFamily: fonts.display, fontSize: 24, color: colors.ink }, style]}>{value}</Text>
      <Label style={{ fontSize: 10, marginTop: 1 }}>{text}</Label>
    </View>
  );
}

export const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.lg,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
    minHeight: 46,
  },
  btnSmall: { minHeight: 36, paddingHorizontal: 14 },
  btnText: { fontFamily: fonts.semibold, fontSize: 15 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 12,
    minHeight: 32,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink2, maxWidth: 220 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
});
