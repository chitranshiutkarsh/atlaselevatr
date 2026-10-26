import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, space } from '../theme';
import { Body, Chip, Display, Label } from './ui';

export function Field({
  label,
  hint,
  max,
  value,
  required,
  style,
  ...p
}: TextInputProps & { label: string; hint?: string; max?: number; required?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Label>
          {label}
          {required ? '' : '  · optional'}
        </Label>
        {max && value ? <Label style={{ fontSize: 10 }}>{`${value.length}/${max}`}</Label> : null}
      </View>
      <TextInput
        {...p}
        value={value}
        maxLength={max}
        placeholderTextColor={colors.ink3}
        onFocus={(e) => {
          setFocused(true);
          p.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          p.onBlur?.(e);
        }}
        style={[f.input, p.multiline && f.multiline, focused && f.focused, style]}
      />
      {hint ? <Body muted style={{ fontSize: 13, lineHeight: 18 }}>{hint}</Body> : null}
    </View>
  );
}

export function Choice({
  label,
  options,
  value,
  onChange,
  required = true,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Label>
        {label}
        {required ? '' : '  · optional'}
      </Label>
      <View style={f.wrap}>
        {options.map(([k, l]) => (
          <Chip key={k} label={l} on={value === k} onPress={() => onChange(value === k && !required ? '' : k)} />
        ))}
      </View>
    </View>
  );
}

export function MultiChoice({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: [string, string][];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}  · pick any</Label>
      <View style={f.wrap}>
        {options.map(([k, l]) => {
          const on = values.includes(k);
          return <Chip key={k} label={l} on={on} icon={on ? 'check' : undefined} onPress={() => onChange(on ? values.filter((x) => x !== k) : [...values, k])} />;
        })}
      </View>
    </View>
  );
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.ink }}>{label}</Text>
        {hint ? <Body muted style={{ fontSize: 13, lineHeight: 18, marginTop: 2 }}>{hint}</Body> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.moss, false: colors.paper2 }} thumbColor={colors.white} />
    </View>
  );
}

// A tappable field that opens a searchable full-screen list.
export function Picker({
  label,
  title,
  value,
  options,
  onChange,
  placeholder = 'Choose',
  required = true,
  allowClear,
  compact,
}: {
  label?: string;
  title: string;
  value: string | null;
  options: { value: string; label: string; hint?: string }[];
  onChange: (v: string | null) => void;
  placeholder?: string;
  required?: boolean;
  allowClear?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const current = options.find((o) => o.value === value);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? options.filter((o) => o.label.toLowerCase().includes(term) || o.hint?.toLowerCase().includes(term)) : options;
  }, [q, options]);

  const close = () => {
    setOpen(false);
    setQ('');
  };

  return (
    <>
      {compact ? (
        <Chip label={current ? current.label : placeholder} on={!!current} icon="chevron-down" onPress={() => setOpen(true)} />
      ) : (
        <View style={{ gap: 6 }}>
          {label ? (
            <Label>
              {label}
              {required ? '' : '  · optional'}
            </Label>
          ) : null}
          <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [f.input, f.pickerRow, pressed && { opacity: 0.85 }]}>
            <Text style={{ fontFamily: fonts.body, fontSize: 15, color: current ? colors.ink : colors.ink3, flex: 1 }} numberOfLines={1}>
              {current ? current.label : placeholder}
            </Text>
            <Feather name="chevron-down" size={18} color={colors.ink2} />
          </Pressable>
        </View>
      )}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={['top', 'bottom']}>
          <View style={f.sheetHead}>
            <Display size={22}>{title}</Display>
            <Pressable onPress={close} hitSlop={12} accessibilityLabel="Close">
              <Feather name="x" size={24} color={colors.ink} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search"
              placeholderTextColor={colors.ink3}
              autoCorrect={false}
              style={f.input}
              clearButtonMode="while-editing"
            />
          </View>
          <FlatList
            data={allowClear ? [{ value: '__any', label: placeholder }, ...shown] : shown}
            keyExtractor={(o) => o.value}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const on = item.value === value || (item.value === '__any' && !value);
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value === '__any' ? null : item.value);
                    close();
                  }}
                  style={({ pressed }) => [f.option, pressed && { backgroundColor: colors.paper2 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: on ? fonts.semibold : fonts.body, fontSize: 16, color: colors.ink }}>{item.label}</Text>
                    {'hint' in item && item.hint ? <Label style={{ fontSize: 10, marginTop: 2 }}>{item.hint}</Label> : null}
                  </View>
                  {on && <Feather name="check" size={18} color={colors.moss} />}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={f.error}>
      <Feather name="alert-circle" size={16} color={colors.signal} />
      <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.signal }}>{message}</Text>
    </View>
  );
}

const f = StyleSheet.create({
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,33,61,0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    minHeight: 46,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
  focused: { borderColor: colors.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerRow: { flexDirection: 'row', alignItems: 'center' },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  error: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.signalSoft,
  },
});
