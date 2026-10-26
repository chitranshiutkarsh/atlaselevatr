import { db } from './db';
import { refreshCoverage } from './engine';
import { COUNTRIES, prettyName } from './geo';
import {
  DISCOVERY_ATS,
  feedUrls,
  normalizeFeed,
  parseCareersUrl,
  roleCountry,
  roleKind,
  slugCandidates,
  smartRecruitersCandidates,
  verifyBoard,
} from './careers-core';

// Jobs on Atlas come from the startups already mapped to problems. For each
// startup we look for a public careers board (Greenhouse, Lever, Ashby,
// SmartRecruiters, Recruitee), import its open roles every day, and link each
// role to the problems its company works on (problem_matches, from the engine).
//
// Boards get onto Atlas three ways:
//   discovered: guessed from the startup's name, kept only if verifyBoard() agrees
//   startup:    a startup adds its careers link at /hiring
//   admin:      added or approved in /admin → Careers
// Only 'verified' boards show roles. 'review' boards wait for an admin.

const UA = 'AtlasJobs/1.0 (+https://atlaselevatr.in/jobs)';
const FETCH_MS = 6000;

async function getJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: ctrl.signal, cache: 'no-store' });
    if (res.status === 404 || res.status === 410) return { missing: true };
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const text = await res.text();
    try {
      return { data: JSON.parse(text) };
    } catch {
      return { missing: true }; // an HTML page, e.g. a "board not found" screen
    }
  } catch (err) {
    return { error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

// Reads one board. Returns { state: 'ok' | 'missing' | 'error', roles, boardName, error }.
export async function readBoard(ats, token) {
  const urls = feedUrls(ats, token);
  if (!urls) return { state: 'error', roles: [], error: 'not an importable board' };
  let boardName = null;
  if (urls.meta) {
    const meta = await getJson(urls.meta);
    if (meta.missing) return { state: 'missing', roles: [] };
    if (meta.error) return { state: 'error', roles: [], error: meta.error };
    boardName = typeof meta.data?.name === 'string' ? meta.data.name : null;
  }
  const feed = await getJson(urls.jobs);
  if (feed.missing) return { state: 'missing', roles: [] };
  if (feed.error) return { state: 'error', roles: [], error: feed.error };
  const d = feed.data;
  const looksRight =
    (ats === 'greenhouse' && Array.isArray(d?.jobs)) ||
    (ats === 'lever' && Array.isArray(d)) ||
    (ats === 'ashby' && Array.isArray(d?.jobs)) ||
    (ats === 'smartrecruiters' && Array.isArray(d?.content)) ||
    (ats === 'recruitee' && Array.isArray(d?.offers));
  if (!looksRight) return { state: 'missing', roles: [] };
  const roles = normalizeFeed(ats, token, d);
  if (!boardName) boardName = roles.find((r) => r.company_name)?.company_name || null;
  return { state: 'ok', roles, boardName };
}

function companyCtx(c) {
  return { name: c.name, country: c.country, countryPretty: prettyName(c.country), city: c.city };
}

// Saves (or replaces) a startup's board.
export async function saveBoard({ companyId, ats, token, status, source, boardName = null, evidence = null, submitter = null, ip = null }) {
  const sql = await db();
  await sql`INSERT INTO careers_boards (company_id, ats, token, status, source, board_name, evidence, submitter, ip_hash)
    VALUES (${companyId}, ${ats}, ${token}, ${status}, ${source}, ${boardName}, ${evidence}, ${submitter}, ${ip})
    ON CONFLICT (company_id) DO UPDATE SET ats = EXCLUDED.ats, token = EXCLUDED.token, status = EXCLUDED.status,
      source = EXCLUDED.source, board_name = EXCLUDED.board_name, evidence = EXCLUDED.evidence,
      submitter = COALESCE(EXCLUDED.submitter, careers_boards.submitter),
      ip_hash = COALESCE(EXCLUDED.ip_hash, careers_boards.ip_hash), last_error = NULL, updated_at = now()`;
  await sql`UPDATE companies SET careers_checked = now() WHERE id = ${companyId}`;
}

// Adds a careers link given by a startup (or an admin). Importable boards are
// read straight away; they go live when they check out (or an admin added them).
export async function addCareersLink({ company, url, source, submitter = null, ip = null }) {
  const parsed = parseCareersUrl(url);
  if (!parsed) return { error: 'That link does not look right. Paste the full https:// link to your careers page.' };
  const trusted = source === 'admin';
  if (parsed.ats === 'link') {
    await saveBoard({ companyId: company.id, ats: 'link', token: parsed.token, status: trusted ? 'verified' : 'review', source, submitter, ip });
    return { status: trusted ? 'verified' : 'review', ats: 'link', roles: 0 };
  }
  const res = await readBoard(parsed.ats, parsed.token);
  if (res.state === 'missing') return { error: 'We could not find a job board at that link. Check it opens your open roles.' };
  if (res.state === 'error') return { error: `We could not read that board right now (${res.error}). Try again in a few minutes.` };
  const verdict = verifyBoard(companyCtx(company), res);
  const status = trusted || verdict?.status === 'verified' ? 'verified' : 'review';
  await saveBoard({
    companyId: company.id,
    ats: parsed.ats,
    token: parsed.token,
    status,
    source,
    boardName: res.boardName,
    evidence: trusted ? 'added by admin' : verdict?.evidence || 'no match yet',
    submitter,
    ip,
  });
  const n = status === 'verified' ? await storeRoles(company.id, parsed.ats, res.roles) : 0;
  if (status !== 'verified') {
    const sql = await db();
    await sql`UPDATE careers_boards SET open_roles = ${res.roles.length}, last_synced = now() WHERE company_id = ${company.id}`;
  }
  return { status, ats: parsed.ats, roles: status === 'verified' ? n : res.roles.length };
}

// Writes a board's roles: new ones added, changed ones updated, gone ones closed.
export async function storeRoles(companyId, ats, roles) {
  const sql = await db();
  const rows = roles.map((r) => ({
    ...r,
    kind: roleKind(r.title, r.team),
    atlasCountry: roleCountry(r, COUNTRIES, prettyName),
  }));
  if (rows.length) {
    await sql`INSERT INTO roles (company_id, ats, external_id, title, team, location, country, remote, employment, kind, url, posted_at)
      SELECT ${companyId}, ${ats}, t.e, t.ti, t.te, t.l, t.c, t.r, t.em, t.k, t.u, t.p
      FROM unnest(${rows.map((r) => r.external_id)}::text[], ${rows.map((r) => r.title)}::text[],
                  ${rows.map((r) => r.team)}::text[], ${rows.map((r) => r.location)}::text[],
                  ${rows.map((r) => r.atlasCountry)}::text[], ${rows.map((r) => Boolean(r.remote))}::boolean[],
                  ${rows.map((r) => r.employment)}::text[], ${rows.map((r) => r.kind)}::text[],
                  ${rows.map((r) => r.url)}::text[], ${rows.map((r) => r.posted_at)}::timestamptz[])
        AS t(e, ti, te, l, c, r, em, k, u, p)
      ON CONFLICT (company_id, ats, external_id) DO UPDATE SET
        title = EXCLUDED.title, team = EXCLUDED.team, location = EXCLUDED.location, country = EXCLUDED.country,
        remote = EXCLUDED.remote, employment = EXCLUDED.employment, kind = EXCLUDED.kind, url = EXCLUDED.url,
        posted_at = COALESCE(EXCLUDED.posted_at, roles.posted_at), active = true, last_seen = now()`;
  }
  await sql`UPDATE roles SET active = false
    WHERE company_id = ${companyId} AND active
      AND NOT (ats = ${ats} AND external_id = ANY(${rows.map((r) => r.external_id)}::text[]))`;
  await sql`UPDATE careers_boards SET open_roles = ${rows.length}, last_synced = now(), last_error = NULL
    WHERE company_id = ${companyId}`;
  return rows.length;
}

// Re-reads one saved board and refreshes its roles.
export async function syncBoard(board) {
  const sql = await db();
  if (board.ats === 'link') return { company_id: board.company_id, skipped: true };
  const res = await readBoard(board.ats, board.token);
  if (res.state === 'ok') {
    const n = board.status === 'verified' ? await storeRoles(board.company_id, board.ats, res.roles) : 0;
    if (board.status !== 'verified') {
      await sql`UPDATE careers_boards SET open_roles = ${res.roles.length}, last_synced = now(), last_error = NULL
        WHERE company_id = ${board.company_id}`;
    }
    return { company_id: board.company_id, roles: n };
  }
  if (res.state === 'missing') {
    await sql`UPDATE careers_boards SET status = 'broken', open_roles = 0, last_synced = now(), last_error = 'Board not found'
      WHERE company_id = ${board.company_id}`;
    await sql`UPDATE roles SET active = false WHERE company_id = ${board.company_id} AND active`;
    return { company_id: board.company_id, broken: true };
  }
  await sql`UPDATE careers_boards SET last_synced = now(), last_error = ${res.error || 'error'} WHERE company_id = ${board.company_id}`;
  return { company_id: board.company_id, error: res.error };
}

// Tries to find one startup's board by guessing its name on each tool.
// Stops (without marking the startup checked) if the run's deadline passes.
export async function discoverCompany(company, deadline = Infinity) {
  const sql = await db();
  const ctx = companyCtx(company);
  for (const ats of DISCOVERY_ATS) {
    const tokens = ats === 'smartrecruiters' ? smartRecruitersCandidates(company.name) : slugCandidates(company.name);
    for (const token of tokens) {
      if (Date.now() > deadline) return { timeout: true };
      const res = await readBoard(ats, token);
      if (res.state !== 'ok' || res.roles.length === 0) continue;
      const verdict = verifyBoard(ctx, res);
      if (!verdict) continue;
      await saveBoard({
        companyId: company.id,
        ats,
        token,
        status: verdict.status,
        source: 'discovered',
        boardName: res.boardName,
        evidence: verdict.evidence,
      });
      if (verdict.status === 'verified') await storeRoles(company.id, ats, res.roles);
      else await sql`UPDATE careers_boards SET open_roles = ${res.roles.length}, last_synced = now() WHERE company_id = ${company.id}`;
      return { found: ats, token, status: verdict.status, roles: res.roles.length };
    }
  }
  await sql`UPDATE companies SET careers_checked = now() WHERE id = ${company.id}`;
  return null;
}

async function inParallel(items, size, fn, deadline) {
  const out = [];
  let i = 0;
  async function worker() {
    while (i < items.length && Date.now() < deadline) {
      const item = items[i++];
      try {
        out.push(await fn(item));
      } catch (err) {
        console.error('careers task failed', err);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

// One bounded run of the jobs pipeline:
//   1. match problems to startups (so every role knows what it works on)
//   2. refresh verified boards not read in the last 20 hours
//   3. look for boards at startups not checked yet, the most relevant first
// Only one run happens at a time. `minGapMinutes` skips the run if another
// finished recently (used by the public trigger).
export async function runJobsRefresh({ budgetMs = 40000, minGapMinutes = 0, discover = 80 } = {}) {
  const sql = await db();
  const started = Date.now();
  const deadline = started + budgetMs;

  if (minGapMinutes > 0) {
    const [last] = await sql`SELECT value FROM meta WHERE key = 'jobs_last_run'`;
    if (last && Date.now() - new Date(last.value).getTime() < minGapMinutes * 60000) return { skipped: 'ran recently' };
  }
  const lock = await sql`INSERT INTO meta (key, value) VALUES ('jobs_lock', now()::text)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      WHERE meta.value::timestamptz < now() - interval '6 minutes'
    RETURNING key`;
  if (lock.length === 0) return { skipped: 'already running' };

  const summary = { matched: 0, synced: 0, discovered: 0, checked: 0, roles: 0 };
  try {
    summary.matched = await refreshCoverage({ max: 25, staleHours: 24 }).catch(() => 0);

    const due = await sql`SELECT company_id, ats, token, status FROM careers_boards
      WHERE status = 'verified' AND ats <> 'link' AND (last_synced IS NULL OR last_synced < now() - interval '20 hours')
      ORDER BY last_synced ASC NULLS FIRST LIMIT 60`;
    const synced = await inParallel(due, 6, syncBoard, deadline - 12000);
    summary.synced = synced.length;

    if (discover > 0 && Date.now() < deadline - 5000) {
      // Startups linked to a problem (or unicorns) that were never checked, or
      // not in the last 30 days, best-linked first.
      const todo = await sql`SELECT c.id, c.name, c.country, c.city
        FROM companies c
        WHERE (c.careers_checked IS NULL OR c.careers_checked < now() - interval '30 days')
          AND NOT EXISTS (SELECT 1 FROM careers_boards b WHERE b.company_id = c.id)
          AND (c.is_unicorn OR EXISTS (SELECT 1 FROM problem_matches m WHERE m.company_id = c.id))
        ORDER BY c.careers_checked ASC NULLS FIRST,
          (SELECT count(*) FROM problem_matches m WHERE m.company_id = c.id) DESC,
          c.is_unicorn DESC, c.last_funded DESC NULLS LAST, c.id ASC
        LIMIT ${discover}`;
      const stopAt = deadline - 3000;
      const found = await inParallel(todo, 8, (c) => discoverCompany(c, stopAt), stopAt);
      const done = found.filter((f) => !f?.timeout);
      summary.checked = done.length;
      summary.discovered = done.filter(Boolean).length;
    }
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM roles r JOIN careers_boards b ON b.company_id = r.company_id
      WHERE r.active AND b.status = 'verified'`;
    summary.roles = n;
  } finally {
    await sql`INSERT INTO meta (key, value) VALUES ('jobs_last_run', now()::text)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`.catch(() => {});
    await sql`DELETE FROM meta WHERE key = 'jobs_lock'`.catch(() => {});
  }
  summary.ms = Date.now() - started;
  return summary;
}
