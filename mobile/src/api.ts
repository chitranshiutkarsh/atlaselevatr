import Constants from 'expo-constants';
import { getDeviceId, getRefCode } from './store';
import type {
  Builder,
  Comment,
  Home,
  Invite,
  Job,
  Me,
  Meta,
  ProblemDetail,
  ProblemSummary,
  ProofSummary,
  ReportKind,
  Startup,
} from './types';

// The app talks to the live Atlas site. For local testing, start the app with
// EXPO_PUBLIC_API_URL=http://<your-computer-ip>:3000 npx expo start
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'https://atlaselevatr.in'
).replace(/\/$/, '');

export const SITE_URL = 'https://atlaselevatr.in';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Options = { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number };

export async function request<T>(path: string, { method = 'GET', body, timeoutMs = 20000 }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-atlas-device': await getDeviceId(),
    'x-atlas-app': Constants.expoConfig?.version || '1',
  };
  const ref = await getRefCode();
  if (ref) headers['x-atlas-ref'] = ref;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'omit',
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('Could not reach Atlas. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timer);
  }
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    // Non-JSON error page.
  }
  if (!res.ok) throw new ApiError(data?.error || `Something went wrong (${res.status}).`, res.status);
  return data as T;
}

const qs = (params: Record<string, string | number | boolean | null | undefined>) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v === true ? 1 : v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export type Sort = 'top' | 'new' | 'discover' | 'gaps';
export type ProblemFilters = { country?: string | null; industry?: string | null; q?: string | null };

export const api = {
  meta: () => request<Meta>('/api/app/meta'),
  home: () => request<Home>('/api/app/home'),
  me: () => request<Me>('/api/app/me'),

  problems: (sort: Exclude<Sort, 'gaps'>, f: ProblemFilters, offset = 0, limit = 20) =>
    request<{ problems: ProblemSummary[] }>(
      `/api/problems${qs({ sort, country: f.country, industry: f.industry, q: f.q, offset, limit })}`
    ),
  gaps: (f: ProblemFilters) =>
    request<{ problems: ProblemSummary[] }>(`/api/app/gaps${qs({ country: f.country, industry: f.industry, q: f.q, limit: 60 })}`),
  problem: (id: number) => request<ProblemDetail>(`/api/app/problems/${id}`),
  similar: (q: string) =>
    request<{ problems: Pick<ProblemSummary, 'id' | 'title' | 'country' | 'industry' | 'votes'>[] }>(
      `/api/problems/similar${qs({ q })}`
    ),

  face: (id: number) => request<{ votes: number; voted: boolean; already: boolean }>(`/api/problems/${id}/vote`, { method: 'POST' }),
  view: (id: number) => request<{ views: number }>(`/api/problems/${id}/view`, { method: 'POST' }),
  story: (id: number, body: Record<string, unknown>) =>
    request<{ ok: boolean; votes: number; summary: ProofSummary }>(`/api/problems/${id}/proof`, { method: 'POST', body }),
  comment: (id: number, body: Record<string, unknown>) =>
    request<{ comment: Comment }>(`/api/problems/${id}/comments`, { method: 'POST', body }),
  helpful: (commentId: number) =>
    request<{ helpful: number; already: boolean }>(`/api/comments/${commentId}/helpful`, { method: 'POST' }),
  build: (id: number, body: Record<string, unknown>) =>
    request<{ ok: boolean; builders: number; id: number }>(`/api/problems/${id}/build`, { method: 'POST', body }),
  follow: (id: number, email: string) =>
    request<{ ok: boolean }>(`/api/problems/${id}/follow`, { method: 'POST', body: { email } }),
  addProblem: (body: Record<string, unknown>) =>
    request<{ ok: boolean; id: number; startups: { local: number; world: number; top: string[] } | null }>(
      '/api/problems',
      { method: 'POST', body, timeoutMs: 45000 }
    ),
  report: (kind: ReportKind, id: number, reason: string, note?: string) =>
    request<{ ok: boolean }>('/api/app/report', { method: 'POST', body: { kind, id, reason, note } }),

  startups: (f: { q?: string | null; country?: string | null; industry?: string | null; unicorn?: boolean }, offset = 0, limit = 24) =>
    request<{ companies: Startup[]; total: number; industries: { industry: string; count: number }[] }>(
      `/api/companies${qs({ q: f.q, country: f.country, industry: f.industry, unicorn: f.unicorn, offset, limit })}`
    ),
  jobs: (industry?: string | null) => request<{ jobs: Job[] }>(`/api/app/jobs${qs({ industry })}`),
  builders: (need?: string | null) => request<{ builders: Builder[] }>(`/api/app/builders${qs({ need })}`),
  intro: (builderId: number, body: { name: string; email: string; message?: string }) =>
    request<{ ok: boolean }>(`/api/builders/${builderId}/intro`, { method: 'POST', body }),
  createInvite: (name: string) => request<{ invite: Invite }>('/api/invite', { method: 'POST', body: { name } }),
};

export const links = {
  problem: (id: number, ref?: string | null) => `${SITE_URL}/problems/${id}${ref ? `?ref=${ref}` : ''}`,
  invite: (code: string) => `${SITE_URL}/r/${code}`,
  startupsFor: (id: number) => `${SITE_URL}/problems/${id}/startups`,
};
