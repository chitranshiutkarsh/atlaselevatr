import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { api } from '@/api';
import { Choice, Field, FormError } from '@/components/form';
import { ModalShell } from '@/components/ModalShell';
import { Body, Button, Card, Display } from '@/components/ui';
import { useMeta } from '@/hooks';
import { hideItem } from '@/store';
import type { ReportKind } from '@/types';

const NOUN: Record<ReportKind, string> = {
  problem: 'problem',
  comment: 'comment',
  story: 'story',
  builder: 'builder card',
};

// Report anything people post. It disappears for you straight away, and the
// Atlas team reviews it; items several people report are hidden for everyone.
export default function ReportScreen() {
  const params = useLocalSearchParams<{ kind: ReportKind; id: string; problem?: string }>();
  const kind = (Object.keys(NOUN) as ReportKind[]).includes(params.kind) ? params.kind : 'problem';
  const id = parseInt(params.id, 10);
  const meta = useMeta();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const submit = useMutation({
    mutationFn: () => api.report(kind, id, reason, note.trim() || undefined),
    onSuccess: async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await hideItem(kind, id);
      qc.invalidateQueries({ queryKey: ['problems'] });
    },
  });

  if (submit.isSuccess) {
    return (
      <ModalShell eyebrow="Reported" title="Thanks for flagging it">
        <Card>
          <Display size={18}>It's hidden for you now.</Display>
          <Body muted style={{ marginTop: 6 }}>
            The Atlas team will review it. If several people report the same {NOUN[kind]}, it is hidden for everyone until then.
          </Body>
        </Card>
        <Button
          title="Done"
          onPress={() => {
            router.back();
            // A reported problem leaves its own page too.
            if (kind === 'problem') setTimeout(() => router.canGoBack() && router.back(), 50);
          }}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell
      eyebrow="Report"
      title={`Report this ${NOUN[kind]}`}
      intro={`Tell us what is wrong. You can also write to ${meta.links.contact}.`}
      footer={
        <>
          <FormError message={submit.isError ? (submit.error as Error).message : null} />
          <Button title="Send report" variant="signal" onPress={() => submit.mutate()} busy={submit.isPending} disabled={!reason || !(id > 0)} />
        </>
      }
    >
      <Choice label="What's wrong?" options={meta.reportReasons} value={reason} onChange={setReason} />
      <Field label="Anything else" multiline max={500} value={note} onChangeText={setNote} />
    </ModalShell>
  );
}
