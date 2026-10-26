import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { api } from '@/api';
import { Field, FormError } from '@/components/form';
import { ModalShell } from '@/components/ModalShell';
import { Button, Chip } from '@/components/ui';
import type { ProblemDetail } from '@/types';

// Suggest a solution (or leave a comment) on a problem. No sign-in.
export default function SuggestScreen() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = parseInt(raw, 10);
  const qc = useQueryClient();
  const started = useRef(Date.now());
  const [kind, setKind] = useState<'solution' | 'comment'>('solution');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');

  const submit = useMutation({
    mutationFn: () => api.comment(id, { body, author, kind, t: started.current }),
    onSuccess: ({ comment }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      qc.setQueryData<ProblemDetail>(['problem', id], (d) => (d ? { ...d, comments: [...d.comments, comment] } : d));
      qc.invalidateQueries({ queryKey: ['problem', id] });
      router.back();
    },
  });

  return (
    <ModalShell
      eyebrow="How to solve it"
      title={kind === 'solution' ? 'Suggest a solution' : 'Leave a comment'}
      intro="Ideas are public. Others can mark the useful ones as helpful."
      footer={
        <>
          <FormError message={submit.isError ? (submit.error as Error).message : null} />
          <Button title="Post" onPress={() => submit.mutate()} busy={submit.isPending} disabled={body.trim().length < 10} />
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="An idea" on={kind === 'solution'} onPress={() => setKind('solution')} />
        <Chip label="A comment" on={kind === 'comment'} onPress={() => setKind('comment')} />
      </View>
      <Field
        label={kind === 'solution' ? 'Your idea' : 'Your comment'}
        required
        multiline
        max={2000}
        value={body}
        onChangeText={setBody}
        placeholder={kind === 'solution' ? 'How would you solve it? Who would pay?' : 'Add context, a question or an experience.'}
        hint="At least a sentence, and at most two links."
        autoFocus
      />
      <Field label="Your name" max={60} value={author} onChangeText={setAuthor} placeholder="Leave blank to stay anonymous" />
    </ModalShell>
  );
}
