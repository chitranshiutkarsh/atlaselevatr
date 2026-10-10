import { db } from './db';

// Startup recommendation engine.
// For any problem it finds the startups in the Atlas directory that work on
// the same thing, anywhere in the world, using Postgres full-text search over
// each startup's name, the problem it solves and its sector. Startups people
// link by hand ("Know a startup solving this?") always come first.
//
// Scoring (higher is a better match):
//   4 per title keyword the startup matches, 2 per keyword from the details
//   + 10 × ts_rank (how dense the match is)
//   + 1.5 if it is in the same industry, + 1 if in the same country, + 0.5 if a unicorn
// A startup must match at least two different keywords, one of them from the problem's title.

const STOP = new Set(
  `a about above after again against all also am an and any are as at be because been before being below between
  both but by can cannot could did do does doing down during each even ever every few for from further get gets
  getting got had has have having he her here hers him his how i if in into is it its itself just keep keeps kept
  less let like lot lots made make makes many may me more most much must my never no nor not now of off often on
  once one only or other our out over own per quite rather really same she should so some still such than that
  the their them then there these they this those through to too under until up upon us very via was we were
  what when where which while who whom why will with within without would yet you your
  problem problems issue issues people person someone everyone many lack lacks lacking hard harder difficult
  easy easily cannot cant can't dont don't doesnt won't wont need needs needed want wants find finds found
  struggle struggles struggled faced face faces facing way ways get often still across real really new old
  becoming become becomes long time times day days week weeks year years often little enough without
  small large big good bad poor high low cost costs costly expensive cheap affordable unaffordable
  demand better early number far leaving rapidly rising quick quickly access support service services working
  turn nowhere follow ups eat lose losing lost hours check checking pending verified burden squeeze threaten
  wipes outstrips platform app apps online help helps helping based provide provides using use used users user
  able unable keep simple simply right wrong due back first last next end`
    .split(/\s+/)
    .filter(Boolean)
);

export function keywords(title = '', details = '') {
  const pick = (text) =>
    String(text)
      .toLowerCase()
      .replace(/[’']/g, '')
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 3 && !STOP.has(w));
  const t = [...new Set(pick(title))];
  const d = [...new Set(pick(details))].filter((w) => !t.includes(w));
  return { title: t.slice(0, 10), details: d.slice(0, 10) };
}

// Runs the engine for one problem. Returns { local, world, linked, totals }.
export async function recommendStartups(problem, { limit = 24 } = {}) {
  const sql = await db();
  const { title, details } = keywords(problem.title, problem.details);
  const terms = [...title, ...details];

  const linked = await sql`SELECT c.id, c.name, c.country, c.city, c.industry, c.sector, c.problem, c.website,
      c.is_unicorn, ps.source
    FROM problem_startups ps JOIN companies c ON c.id = ps.company_id
    WHERE ps.problem_id = ${problem.id}
    ORDER BY ps.created_at ASC`;

  let matches = [];
  if (terms.length) {
    const query = terms.join(' | ');
    matches = await sql`WITH q AS (SELECT to_tsquery('english', ${query}) AS q),
      hits AS (
        SELECT c.id, c.name, c.country, c.city, c.industry, c.sector, c.problem, c.website, c.is_unicorn,
          to_tsvector('english', c.name || ' ' || c.problem || ' ' || coalesce(c.sector, '')) AS v
        FROM companies c, q
        WHERE to_tsvector('english', c.name || ' ' || c.problem || ' ' || coalesce(c.sector, '')) @@ q.q
        LIMIT 2000
      ),
      scored AS (
        SELECT h.*,
          (SELECT count(*) FROM unnest(${title}::text[]) t WHERE h.v @@ plainto_tsquery('english', t))::int AS title_hits,
          (SELECT count(*) FROM unnest(${details}::text[]) t WHERE h.v @@ plainto_tsquery('english', t))::int AS detail_hits,
          ts_rank(h.v, (SELECT q FROM q)) AS rank
        FROM hits h
      )
      SELECT id, name, country, city, industry, sector, problem, website, is_unicorn,
        round((title_hits * 4 + detail_hits * 2 + rank * 10
          + CASE WHEN industry = ${problem.industry} THEN 1.5 ELSE 0 END
          + CASE WHEN country = ${problem.country} THEN 1 ELSE 0 END
          + CASE WHEN is_unicorn THEN 0.5 ELSE 0 END)::numeric, 2)::float AS score,
        title_hits + detail_hits AS hits
      FROM scored
      WHERE title_hits >= 1 AND (title_hits + detail_hits) >= 2
      ORDER BY score DESC, is_unicorn DESC, name ASC
      LIMIT 400`;
  }

  const linkedIds = new Set(linked.map((c) => c.id));
  const engine = matches.filter((c) => !linkedIds.has(c.id));
  const all = [...linked.map((c) => ({ ...c, linked: true })), ...engine];
  const localAll = all.filter((c) => c.country === problem.country);
  const worldAll = all.filter((c) => c.country !== problem.country);
  const totals = { local: localAll.length, world: all.length };

  // Remember how crowded this problem is, for the gap finder.
  await sql`INSERT INTO problem_coverage (problem_id, world, local, computed_at)
    VALUES (${problem.id}, ${totals.world}, ${totals.local}, now())
    ON CONFLICT (problem_id) DO UPDATE SET world = EXCLUDED.world, local = EXCLUDED.local, computed_at = now()`;

  return {
    local: localAll.slice(0, limit),
    world: worldAll.slice(0, limit),
    totals,
    keywords: terms,
  };
}

// How crowded is this problem? Plain-language label for the gap finder.
export function gapVerdict(totals, country) {
  if (!totals) return null;
  if (totals.world === 0) {
    return { kind: 'open', label: 'Open whitespace', text: 'No startup on Atlas works on this yet, anywhere.' };
  }
  if (totals.local === 0) {
    return {
      kind: 'gap',
      label: `Gap in ${country}`,
      text: `${totals.world} startup${totals.world === 1 ? '' : 's'} elsewhere work${totals.world === 1 ? 's' : ''} on this, none in ${country}.`,
    };
  }
  if (totals.local <= 3) {
    return { kind: 'thin', label: 'Thin competition', text: `Only ${totals.local} in ${country}, ${totals.world} worldwide.` };
  }
  return { kind: 'crowded', label: 'Crowded', text: `${totals.local} startups in ${country}, ${totals.world} worldwide.` };
}

// Refreshes coverage for problems that have none or a stale one. Bounded so a
// page view never does too much work; the rest catch up on later views.
export async function refreshCoverage({ max = 15, staleHours = 24 } = {}) {
  const sql = await db();
  const due = await sql`SELECT p.id, p.title, p.details, p.industry, p.country
    FROM problems p LEFT JOIN problem_coverage pc ON pc.problem_id = p.id
    WHERE p.status = 'live'
      AND (pc.problem_id IS NULL OR pc.computed_at < now() - make_interval(hours => ${staleHours}))
    ORDER BY pc.computed_at ASC NULLS FIRST, p.votes DESC
    LIMIT ${max}`;
  for (const p of due) {
    try {
      await recommendStartups(p, { limit: 1 });
    } catch (err) {
      console.error('coverage failed for problem', p.id, err);
    }
  }
  return due.length;
}
