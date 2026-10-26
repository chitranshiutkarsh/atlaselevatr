import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';

// Small persistent values the app keeps on the phone. Nothing here leaves the
// device except the device id (sent with each request so one vote counts once)
// and an invite code someone entered (so whoever invited them gets credit).

const DEVICE_KEY = 'atlas.device';
const REF_KEY = 'atlas.ref';
const HIDDEN_KEY = 'atlas.hidden';
const VIEWS_KEY = 'atlas.views';

let deviceCache: string | null = null;
let refCache: string | null | undefined;

export async function getDeviceId(): Promise<string> {
  if (deviceCache) return deviceCache;
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id || !/^[a-f0-9-]{36}$/.test(id)) {
    id = Crypto.randomUUID().toLowerCase();
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  deviceCache = id;
  return id;
}

export async function getRefCode(): Promise<string | null> {
  if (refCache !== undefined) return refCache;
  refCache = await AsyncStorage.getItem(REF_KEY);
  return refCache;
}

export function validRefCode(code: string) {
  return /^[A-Z2-9]{6}$/.test(code.trim().toUpperCase());
}

export async function setRefCode(code: string) {
  const clean = code.trim().toUpperCase();
  if (!validRefCode(clean)) return false;
  refCache = clean;
  await AsyncStorage.setItem(REF_KEY, clean);
  return true;
}

// ---- Hidden items: anything this person reported disappears for them at once.

type Listener = (hidden: Set<string>) => void;
let hidden = new Set<string>();
let hiddenLoaded = false;
const listeners = new Set<Listener>();

async function loadHidden() {
  if (hiddenLoaded) return;
  hiddenLoaded = true;
  try {
    hidden = new Set(JSON.parse((await AsyncStorage.getItem(HIDDEN_KEY)) || '[]'));
  } catch {
    hidden = new Set();
  }
  listeners.forEach((l) => l(hidden));
}

export async function hideItem(kind: string, id: number) {
  await loadHidden();
  hidden = new Set(hidden).add(`${kind}:${id}`);
  await AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(hidden).slice(-1000)));
  listeners.forEach((l) => l(hidden));
}

export async function clearHidden() {
  hidden = new Set();
  await AsyncStorage.removeItem(HIDDEN_KEY);
  listeners.forEach((l) => l(hidden));
}

export function useHidden() {
  const [state, setState] = useState(hidden);
  useEffect(() => {
    listeners.add(setState);
    loadHidden();
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return {
    hidden: state,
    isHidden: (kind: string, id: number) => state.has(`${kind}:${id}`),
    count: state.size,
  };
}

// ---- Problem views: counted at most once a day per problem, like the website.

export async function shouldCountView(problemId: number) {
  try {
    const seen: Record<string, number> = JSON.parse((await AsyncStorage.getItem(VIEWS_KEY)) || '{}');
    const now = Date.now();
    if (seen[problemId] && now - seen[problemId] < 86_400_000) return false;
    seen[problemId] = now;
    // Keep the map small.
    const recent = Object.fromEntries(Object.entries(seen).filter(([, t]) => now - t < 86_400_000));
    await AsyncStorage.setItem(VIEWS_KEY, JSON.stringify(recent));
    return true;
  } catch {
    return false;
  }
}
