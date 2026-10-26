import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { api } from '@/api';
import { Choice, Field, FormError, MultiChoice, Toggle } from '@/components/form';
import { ModalShell } from '@/components/ModalShell';
import { Body, Button, Card, Display, Label } from '@/components/ui';
import { useMeta } from '@/hooks';
import { colors, space } from '@/theme';

// "Want to build this?": a lead for the venture studio. Contact details go to
// the Atlas team only; a public card shows first name, city, stage and needs.
export default function BuildScreen() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = parseInt(raw, 10);
  const meta = useMeta();
  const qc = useQueryClient();
  const started = useRef(Date.now());
  const [f, setF] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    linkedin: '',
    stage: '',
    commitment: '',
    pitch: '',
    headline: '',
  });
  const [needs, setNeeds] = useState<string[]>([]);
  const [isPublic, setPublic] = useState(true);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = useMutation({
    mutationFn: () => api.build(id, { ...f, needs, is_public: isPublic, t: started.current }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.invalidateQueries({ queryKey: ['problem', id] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['builders'] });
    },
  });

  if (submit.isSuccess) {
    return (
      <ModalShell eyebrow="Got it" title="Thanks for raising your hand">
        <Card tone="moss">
          <Display size={20}>The team will be in touch.</Display>
          <Body muted style={{ marginTop: 6 }}>
            {meta.site.parent} reads every builder. If it's a fit, you'll hear from us by email
            {isPublic ? ', and your card is now on the problem page and the builders board.' : '.'}
          </Body>
        </Card>
        <Button title="Back to the problem" onPress={() => router.back()} />
      </ModalShell>
    );
  }

  const ready = f.name.trim().length >= 2 && /^\S+@\S+\.\S{2,}$/.test(f.email.trim()) && f.stage && f.commitment;

  return (
    <ModalShell
      eyebrow="Claim it"
      title="Want to build this?"
      intro={`Tell the ${meta.site.parent} team where you are with it. Your email and phone are only seen by the team.`}
      footer={
        <>
          <FormError message={submit.isError ? (submit.error as Error).message : null} />
          <Button title="Send to the studio" onPress={() => submit.mutate()} busy={submit.isPending} disabled={!ready} />
        </>
      }
    >
      <Field label="Your name" required max={80} value={f.name} onChangeText={set('name')} autoComplete="name" textContentType="name" />
      <Field
        label="Email"
        required
        max={120}
        value={f.email}
        onChangeText={set('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field label="Phone" max={30} value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
      <Field label="City" max={60} value={f.city} onChangeText={set('city')} />
      <Field label="LinkedIn" max={200} value={f.linkedin} onChangeText={set('linkedin')} autoCapitalize="none" autoCorrect={false} placeholder="linkedin.com/in/you" />
      <Choice label="Where are you with it?" options={meta.builder.stages} value={f.stage} onChange={set('stage')} />
      <Choice label="How much time can you give it?" options={meta.builder.commitment} value={f.commitment} onChange={set('commitment')} />
      <MultiChoice label="What would help most?" options={meta.builder.needs} values={needs} onChange={setNeeds} />
      <Field label="Your plan" multiline max={1500} value={f.pitch} onChangeText={set('pitch')} placeholder="What would you build, for whom, and why you?" />

      <View style={{ gap: space.md, padding: space.md, borderRadius: 12, backgroundColor: colors.paper2 }}>
        <Toggle
          label="Show me on the builders board"
          hint="Shows your first name, city, stage, needs and the headline below. Never your contact details."
          value={isPublic}
          onChange={setPublic}
        />
        {isPublic ? (
          <Field label="Headline" max={140} value={f.headline} onChangeText={set('headline')} placeholder="e.g. Ex-fintech PM building a refunds tracker" />
        ) : null}
      </View>
      <Label style={{ textAlign: 'center' }}>By sending this you agree to be contacted about this problem.</Label>
    </ModalShell>
  );
}
