import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '@/api';
import { Field, FormError, Picker } from '@/components/form';
import { ModalShell } from '@/components/ModalShell';
import { Body, Button, Card, Label } from '@/components/ui';
import { num } from '@/format';
import { useCountryLabel, useDebounced, useMeta } from '@/hooks';
import { colors, fonts, space } from '@/theme';

// Add a problem: no sign-in. Similar problems already on Atlas show up as you
// type, so people say "I face this" instead of adding duplicates.
export default function SubmitScreen() {
  const params = useLocalSearchParams<{ country?: string }>();
  const meta = useMeta();
  const countryLabel = useCountryLabel();
  const qc = useQueryClient();
  const started = useRef(Date.now());
  const [f, setF] = useState({ title: '', details: '', solution: '', author: '', email: '' });
  const [industry, setIndustry] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(
    params.country && meta.countries.some((c) => c.name === params.country) ? params.country : null
  );
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const draft = useDebounced(`${f.title} ${f.details}`.trim(), 500);
  const similar = useQuery({
    queryKey: ['similar', draft],
    queryFn: () => api.similar(draft),
    enabled: draft.split(/\s+/).filter((w) => w.length >= 3).length >= 2,
    staleTime: 60 * 1000,
  });

  const submit = useMutation({
    mutationFn: () =>
      api.addProblem({ ...f, email: f.email.trim() || undefined, industry, country, t: started.current }),
    onSuccess: (res) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['problems'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['home'] });
      router.replace({ pathname: '/problem/[id]', params: { id: String(res.id), new: '1' } });
    },
  });

  const L = meta.limits;
  const ready =
    f.title.trim().length >= L.titleMin && f.solution.trim().length >= L.solutionMin && !!industry && !!country;
  const matches = similar.data?.problems || [];

  return (
    <ModalShell
      eyebrow="Add a problem"
      title="What problem do you face?"
      intro="No sign-up. It goes live straight away, and we check which startups already work on it."
      footer={
        <>
          <FormError message={submit.isError ? (submit.error as Error).message : null} />
          <Button title="Put it on the map" onPress={() => submit.mutate()} busy={submit.isPending} disabled={!ready} />
        </>
      }
    >
      <Field
        label="The problem, in one line"
        required
        max={L.titleMax}
        value={f.title}
        onChangeText={set('title')}
        placeholder="e.g. Getting a refund from a bank takes weeks"
        autoFocus
      />

      {matches.length ? (
        <Card style={{ gap: space.sm }}>
          <Label>Is it one of these?</Label>
          <Body muted style={{ fontSize: 13, lineHeight: 18 }}>
            If so, say you face it there instead. It counts for more.
          </Body>
          {matches.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => router.replace(`/problem/${m.id}`)}
              style={({ pressed }) => [
                { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.ink }} numberOfLines={2}>
                  {m.title}
                </Text>
                <Label style={{ fontSize: 10, marginTop: 2 }}>
                  {countryLabel(m.country)} · {num(m.votes)} face it
                </Label>
              </View>
              <Feather name="chevron-right" size={18} color={colors.ink2} />
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Field
        label="More detail"
        multiline
        max={L.detailsMax}
        value={f.details}
        onChangeText={set('details')}
        placeholder="Who has it, when it happens, what it costs them."
      />
      <Picker
        label="Industry"
        title="Industry"
        value={industry}
        onChange={setIndustry}
        placeholder="Pick an industry"
        options={meta.industries.map((i) => ({ value: i, label: i }))}
      />
      <Picker
        label="Country"
        title="Where is it a problem?"
        value={country}
        onChange={setCountry}
        placeholder="Pick a country"
        options={meta.countries.map((c) => ({ value: c.name, label: c.label, hint: c.continent }))}
      />
      <Field
        label="How would you solve it?"
        required
        multiline
        max={L.solutionMax}
        value={f.solution}
        onChangeText={set('solution')}
        placeholder="A sentence or two. It's pinned on the problem as the first idea."
      />
      <Field label="Your name" max={L.nameMax} value={f.author} onChangeText={set('author')} placeholder="Leave blank to stay anonymous" />
      <Field
        label="Email for updates"
        max={120}
        value={f.email}
        onChangeText={set('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        hint="We'll tell you when someone claims it or suggests a fix. Never shown."
      />
    </ModalShell>
  );
}
