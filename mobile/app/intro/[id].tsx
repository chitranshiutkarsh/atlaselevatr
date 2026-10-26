import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { api } from '@/api';
import { Field, FormError } from '@/components/form';
import { ModalShell } from '@/components/ModalShell';
import { Body, Button, Card, Display } from '@/components/ui';
import { useMeta } from '@/hooks';

// Ask the studio to introduce you to a builder (to join them, advise, invest).
// Builders' contact details stay private; the team makes the introduction.
export default function IntroScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const id = parseInt(params.id, 10);
  const who = params.name || 'this builder';
  const meta = useMeta();
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = useMutation({
    mutationFn: () => api.intro(id, { ...f, message: f.message.trim() || undefined }),
    onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  });

  if (submit.isSuccess) {
    return (
      <ModalShell eyebrow="Sent" title="Intro requested">
        <Card tone="moss">
          <Display size={18}>The {meta.site.parent} team will connect you.</Display>
          <Body muted style={{ marginTop: 6 }}>They'll review your note and make the introduction by email.</Body>
        </Card>
        <Button title="Done" onPress={() => router.back()} />
      </ModalShell>
    );
  }

  return (
    <ModalShell
      eyebrow="Ask for an intro"
      title={`Meet ${who}`}
      intro="Builders' contact details stay private. The studio reads your note and makes the introduction."
      footer={
        <>
          <FormError message={submit.isError ? (submit.error as Error).message : null} />
          <Button
            title="Request intro"
            onPress={() => submit.mutate()}
            busy={submit.isPending}
            disabled={f.name.trim().length < 2 || !/^\S+@\S+\.\S{2,}$/.test(f.email.trim())}
          />
        </>
      }
    >
      <Field label="Your name" required max={80} value={f.name} onChangeText={set('name')} autoComplete="name" />
      <Field label="Email" required max={120} value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      <Field label="Why you want to meet" multiline max={800} value={f.message} onChangeText={set('message')} placeholder="e.g. I'm a backend engineer and want to co-found this." />
    </ModalShell>
  );
}
