import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import bundledMeta from './data/meta.json';
import type { Me, Meta, ProblemDetail } from './types';

// Lists (industries, countries, form options) ship inside the app and are
// refreshed from the site, so edits there reach the app without a release.
export function useMeta(): Meta {
  const { data } = useQuery({
    queryKey: ['meta'],
    queryFn: api.meta,
    staleTime: 6 * 60 * 60 * 1000,
    initialData: bundledMeta as unknown as Meta,
    initialDataUpdatedAt: 0,
  });
  return data;
}

export function useCountryLabel() {
  const meta = useMeta();
  return useMemo(() => {
    const map = new Map(meta.countries.map((c) => [c.name, c.label]));
    return (name?: string | null) => (name ? map.get(name) || name : '');
  }, [meta]);
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: api.me, staleTime: 60 * 1000 });
}

// Problem ids this phone has said "I face this" to: what the server knows,
// plus anything tapped since (so the button flips straight away).
let localFaced = new Set<number>();
const facedListeners = new Set<() => void>();

export function useFaced() {
  const me = useMe();
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    facedListeners.add(l);
    return () => {
      facedListeners.delete(l);
    };
  }, []);
  const server = useMemo(() => new Set((me.data?.faced || []).map((p) => p.id)), [me.data]);
  return (id: number) => server.has(id) || localFaced.has(id);
}

function markFaced(id: number, on: boolean) {
  localFaced = new Set(localFaced);
  if (on) localFaced.add(id);
  else localFaced.delete(id);
  facedListeners.forEach((l) => l());
}

// "I face this": counts the person once, straight away.
export function useFace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.face(id),
    onMutate: (id) => {
      markFaced(id, true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      qc.setQueryData<ProblemDetail>(['problem', id], (d) =>
        d && !d.me.voted ? { ...d, me: { ...d.me, voted: true }, problem: { ...d.problem, votes: d.problem.votes + 1 } } : d
      );
    },
    onSuccess: (res, id) => {
      qc.setQueryData<ProblemDetail>(['problem', id], (d) => (d ? { ...d, problem: { ...d.problem, votes: res.votes } } : d));
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['problems'] });
      qc.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (_e, id) => {
      markFaced(id, false);
      qc.invalidateQueries({ queryKey: ['problem', id] });
    },
  });
}

export function useDebounced<T>(value: T, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export type { Me };
