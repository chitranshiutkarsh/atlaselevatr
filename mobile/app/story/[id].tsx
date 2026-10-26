import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { api } from '@/api';
import { Choice, Field, FormError } from '@/components/form';
import { ModalShell } from '@/components/ModalShell';
import { Button } from '@/components/ui';
import { useMeta } from '@/hooks';
import type { ProblemDetail } from '@/types';

// "I face this" story: one line about what happened, how often, whether you'd
// pay, and who it hits. It is the evidence founders look for.
export default function StoryScreen() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = parseInt(raw, 10);
  const meta = useMeta();
  const qc = useQueryClient();
  const started = useRef(Date.now());
  const [f, setF] = useState({ story: '', frequency: '', pay: '', who: '', city: '', author: '' });
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = useMutation({
    mutationFn: () => api.story(id, { ...f, t: started.current }),
    onSuccess: (res) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.setQueryData<ProblemDetail>(['problem', id], (d) =>
        d ? { ...d, proof: res.summary, me: { ...d.me, voted: true, storied: true }, problem: { ...d.problem, votes: res.votes } } : d
      );
      qc.invalidateQueries({ queryKey: ['problem', id] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['problems'] });
      router.back();
    },
  });

  const ready = f.story.trim().length >= 15 && f.frequency && f.pay && f.who;

  return (
    <ModalShell
      eyebrow="You're counted"
      title="What happened to you?"
      intro={`One line is enough. Stories are public and turn your vote into evidence. ${meta.validation.proofs} of them validate a problem for founders.`}
      footer={
        <>
          <FormError message={submit.isError ? (submit.error as Error).message : null} />
          <Button title="Add my story" onPress={() => submit.mutate()} busy={submit.isPending} disabled={!ready} />
        </>
      }
    >
      <Field
        label="Your story"
        required
        multiline
        max={500}
        value={f.story}
        onChangeText={set('story')}
        placeholder="e.g. Last month I waited three weeks for a refund and called the bank six times."
        hint="At least a sentence. Don't include anyone's private details."
      />
      <Choice label="How often does it happen?" options={meta.proof.frequency} value={f.frequency} onChange={set('frequency')} />
      <Choice label="Would you pay to have it fixed?" options={meta.proof.pay} value={f.pay} onChange={set('pay')} />
      <Choice label="Who does it affect?" options={meta.proof.who} value={f.who} onChange={set('who')} />
      <Field label="City" max={60} value={f.city} onChangeText={set('city')} placeholder="e.g. Hyderabad" />
      <Field label="Your name" max={60} value={f.author} onChangeText={set('author')} placeholder="Leave blank to stay anonymous" />
    </ModalShell>
  );
}
