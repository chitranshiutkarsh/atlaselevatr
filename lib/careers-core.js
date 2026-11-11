// Pure helpers for importing jobs from startups' public careers boards.
// No database access here, so these can be tested on their own.
//
// Supported hiring tools, all through their public, keyless job-board feeds:
//   Greenhouse       https://boards-api.greenhouse.io/v1/boards/{token}/jobs
//   Lever            https://api.lever.co/v0/postings/{site}?mode=json   (EU: api.eu.lever.co)
//   Ashby            https://api.ashbyhq.com/posting-api/job-board/{name}
//   SmartRecruiters  https://api.smartrecruiters.com/v1/companies/{id}/postings
//   Recruitee        https://{slug}.recruitee.com/api/offers/
// Any other careers link is kept as a plain "careers page" link (no import).

export const ATS_LABEL = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  smartrecruiters: 'SmartRecruiters',
  recruitee: 'Recruitee',
  link: 'Careers page',
};

// Tools tried when looking for a startup's board automatically.
export const DISCOVERY_ATS = ['greenhouse', 'lever', 'ashby', 'smartrecruiters'];

export const MAX_ROLES_PER_COMPANY = 300;

// ---------- Careers links ----------

// Reads a careers URL and returns { ats, token, url }. Unknown sites become
// { ats: 'link', token: <the url> }. Returns null for anything that isn't http(s).
export function parseCareersUrl(input) {
  let u;
  try {
    u = new URL(String(input || '').trim());
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const parts = u.pathname.split('/').filter(Boolean);
  const first = (parts[0] || '').toLowerCase();
  const clean = (s) => (/^[a-z0-9][a-z0-9._-]{0,80}$/i.test(s || '') ? s : null);

  if (/(^|\.)greenhouse\.io$/.test(host)) {
    const forParam = u.searchParams.get('for');
    if (forParam && clean(forParam)) return { ats: 'greenhouse', token: forParam.toLowerCase() };
    if (host.startsWith('boards-api.') && first === 'v1' && parts[1] === 'boards' && clean(parts[2])) {
      return { ats: 'greenhouse', token: parts[2].toLowerCase() };
    }
    if (clean(first) && first !== 'embed') return { ats: 'greenhouse', token: first };
  }
  if (host === 'jobs.lever.co' && clean(first)) return { ats: 'lever', token: first };
  if (host === 'jobs.eu.lever.co' && clean(first)) return { ats: 'lever', token: `eu/${first}` };
  if (host === 'api.lever.co' && parts[1] === 'postings' && clean(parts[2])) return { ats: 'lever', token: parts[2].toLowerCase() };
  if (host === 'jobs.ashbyhq.com' && clean(parts[0])) return { ats: 'ashby', token: parts[0] };
  if (host === 'api.ashbyhq.com' && parts[0] === 'posting-api' && clean(parts[2])) return { ats: 'ashby', token: parts[2] };
  if ((host === 'jobs.smartrecruiters.com' || host === 'careers.smartrecruiters.com') && clean(parts[0])) {
    return { ats: 'smartrecruiters', token: parts[0] };
  }
  const rt = host.match(/^([a-z0-9-]+)\.recruitee\.com$/);
  if (rt && rt[1] !== 'www' && rt[1] !== 'app') return { ats: 'recruitee', token: rt[1] };

  return { ats: 'link', token: u.toString().slice(0, 500) };
}

// The public page people open for a board.
export function boardUrl(ats, token) {
  switch (ats) {
    case 'greenhouse':
      return `https://boards.greenhouse.io/${token}`;
    case 'lever':
      return token.startsWith('eu/') ? `https://jobs.eu.lever.co/${token.slice(3)}` : `https://jobs.lever.co/${token}`;
    case 'ashby':
      return `https://jobs.ashbyhq.com/${token}`;
    case 'smartrecruiters':
      return `https://jobs.smartrecruiters.com/${token}`;
    case 'recruitee':
      return `https://${token}.recruitee.com/`;
    default:
      return token;
  }
}

// The JSON feeds read for each tool.
export function feedUrls(ats, token, { content = false } = {}) {
  const t = encodeURIComponent(token);
  switch (ats) {
    case 'greenhouse':
      return {
        meta: `https://boards-api.greenhouse.io/v1/boards/${t}`,
        jobs: `https://boards-api.greenhouse.io/v1/boards/${t}/jobs${content ? '?content=true' : ''}`,
      };
    case 'lever':
      return token.startsWith('eu/')
        ? { jobs: `https://api.eu.lever.co/v0/postings/${encodeURIComponent(token.slice(3))}?mode=json` }
        : { jobs: `https://api.lever.co/v0/postings/${t}?mode=json` };
    case 'ashby':
      return { jobs: `https://api.ashbyhq.com/posting-api/job-board/${t}` };
    case 'smartrecruiters':
      return { jobs: `https://api.smartrecruiters.com/v1/companies/${t}/postings?limit=100` };
    case 'recruitee':
      return { jobs: `https://${t}.recruitee.com/api/offers/` };
    default:
      return null;
  }
}

// ---------- Guessing a startup's board name ----------

const SUFFIXES = /\b(technologies|technology|tech|labs|lab|inc|ltd|limited|pvt|private|llc|corp|corporation|co|company|group|global|india|ai|hq|app|software|solutions|ventures)\b/g;

function asciiFold(s) {
  return String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

export function normName(s) {
  return asciiFold(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}

// Board names to try for a company, most likely first (at most 3).
export function slugCandidates(name) {
  const base = normName(name);
  if (!base) return [];
  const words = base.split(' ');
  const stripped = base.replace(SUFFIXES, ' ').replace(/\s+/g, ' ').trim();
  const out = [words.join(''), stripped.replace(/ /g, ''), words.join('-'), stripped.replace(/ /g, '-')];
  return [...new Set(out.filter((s) => s.length >= 3 && s.length <= 60))].slice(0, 3);
}

// SmartRecruiters identifiers are usually the name in CamelCase.
export function smartRecruitersCandidates(name) {
  const words = asciiFold(name).replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const camel = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  return [...new Set([camel, words.join('')])].filter((s) => s.length >= 3).slice(0, 2);
}

// ---------- Reading each tool's feed into one shape ----------
// A role: { external_id, title, team, location, country, remote, employment, url, posted_at, text }
// `text` is a short plain-text sample of the description, used only to verify
// that a guessed board belongs to the right company. It is never stored.

const stripHtml = (s) =>
  String(s || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const str = (v, max = 200) => {
  if (v == null) return null;
  const s = String(v).replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, max) : null;
};

const iso = (v) => {
  if (v == null || v === '') return null;
  const d = typeof v === 'number' ? new Date(v) : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const REMOTE_RE = /\bremote\b|\bwork from home\b|\bwfh\b|\banywhere\b/i;

function regionName(code) {
  if (!code || typeof code !== 'string' || code.length !== 2) return null;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || null;
  } catch {
    return null;
  }
}

export function normalizeFeed(ats, token, data) {
  const rows = [];
  if (ats === 'greenhouse') {
    for (const j of data?.jobs || []) {
      const location = str(j.location?.name);
      rows.push({
        external_id: String(j.id),
        title: str(j.title),
        team: str(j.departments?.[0]?.name),
        location,
        country: null,
        remote: REMOTE_RE.test(location || ''),
        employment: null,
        url: str(j.absolute_url, 500),
        posted_at: iso(j.first_published || j.updated_at),
        text: stripHtml(j.content).slice(0, 2000),
      });
    }
  } else if (ats === 'lever') {
    const list = Array.isArray(data) ? data : [];
    for (const j of list) {
      const c = j.categories || {};
      const location = str(c.location || (Array.isArray(c.allLocations) ? c.allLocations.join(', ') : null));
      rows.push({
        external_id: String(j.id),
        title: str(j.text),
        team: str(c.team || c.department),
        location,
        country: regionName(j.country),
        remote: j.workplaceType === 'remote' || REMOTE_RE.test(location || ''),
        employment: str(c.commitment, 60),
        url: str(j.hostedUrl || j.applyUrl, 500),
        posted_at: iso(j.createdAt),
        text: str([j.descriptionPlain, j.openingPlain, j.additionalPlain].filter(Boolean).join(' '), 2000) || '',
      });
    }
  } else if (ats === 'ashby') {
    for (const j of data?.jobs || []) {
      if (j.isListed === false) continue;
      const addr = j.address?.postalAddress || {};
      const location = str(j.location || [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', '));
      rows.push({
        external_id: String(j.id || j.jobUrl || j.title),
        title: str(j.title),
        team: str(j.department || j.team),
        location,
        country: str(addr.addressCountry, 60),
        remote: Boolean(j.isRemote) || j.workplaceType === 'Remote' || REMOTE_RE.test(location || ''),
        employment: str(j.employmentType, 60),
        url: str(j.jobUrl || j.applyUrl || (j.id ? `https://jobs.ashbyhq.com/${token}/${j.id}` : null), 500),
        posted_at: iso(j.publishedAt || j.publishedDate),
        text: str(j.descriptionPlain || stripHtml(j.descriptionHtml), 2000) || '',
      });
    }
  } else if (ats === 'smartrecruiters') {
    for (const j of data?.content || []) {
      const l = j.location || {};
      const location = str(l.fullLocation || [l.city, l.region, regionName(l.country) || l.country].filter(Boolean).join(', '));
      const ident = j.company?.identifier || token;
      rows.push({
        external_id: String(j.id || j.uuid),
        title: str(j.name),
        team: str(j.department?.label || j.function?.label),
        location,
        country: regionName(l.country),
        remote: Boolean(l.remote) || REMOTE_RE.test(location || ''),
        employment: str(j.typeOfEmployment?.label, 60),
        url: j.id ? `https://jobs.smartrecruiters.com/${ident}/${j.id}` : null,
        posted_at: iso(j.releasedDate),
        text: str(j.company?.name, 200) || '',
        company_name: str(j.company?.name),
      });
    }
  } else if (ats === 'recruitee') {
    for (const j of data?.offers || []) {
      const location = str(j.location || [j.city, j.country].filter(Boolean).join(', '));
      rows.push({
        external_id: String(j.id),
        title: str(j.title),
        team: str(j.department),
        location,
        country: str(j.country, 60),
        remote: Boolean(j.remote) || REMOTE_RE.test(location || ''),
        employment: str(j.employment_type_code, 60),
        url: str(j.careers_url || j.careers_apply_url, 500),
        posted_at: iso(j.published_at || j.created_at),
        text: str([j.company_name, stripHtml(j.description)].filter(Boolean).join(' '), 2000) || '',
        company_name: str(j.company_name),
      });
    }
  }
  return rows.filter((r) => r.title && r.url && /^https?:\/\//.test(r.url)).slice(0, MAX_ROLES_PER_COMPANY);
}

// ---------- Is this board really this company's? ----------

const INDIA_PLACES =
  /\b(india|bengaluru|bangalore|mumbai|delhi|new delhi|gurgaon|gurugram|noida|hyderabad|pune|chennai|kolkata|ahmedabad|jaipur|kochi|chandigarh|indore|coimbatore|lucknow|bhubaneswar|thiruvananthapuram|trivandrum|vadodara|surat|nagpur|mysuru|mysore|goa|ncr)\b/i;

function placeMatches(text, company) {
  if (!text) return false;
  const t = String(text);
  if (company.country === 'India') return INDIA_PLACES.test(t);
  const names = [company.country, company.countryPretty, company.city].filter(Boolean);
  if (company.country === 'United States of America') names.push('United States', 'USA', 'US', 'NY', 'CA', 'San Francisco', 'New York');
  if (company.country === 'United Kingdom') names.push('UK', 'London', 'England');
  return names.some((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(t));
}

function nameMentioned(text, name) {
  const n = normName(name);
  if (n.length < 3) return false;
  return new RegExp(`(^|[^a-z0-9])${n.replace(/ /g, '[^a-z0-9]*')}([^a-z0-9]|$)`).test(normName(text));
}

// Words too common in job ads to tell companies apart.
const GENERIC = new Set(
  `about after also apps based best build builds building business businesses company companies customer customers
  data digital easy every fast first from global great help helps into just make more most next online people
  platform platforms product products real ready service services simple software solution solutions startup
  startups team teams that their them they this through tools using what with work world your unicorn native
  powered modern smart better leading industry management manage system systems providing provide provides
  private public first worlds largest best including across support supporting delivering deliver offering
  offers trusted mission growing growth fastest scale enable enables power powering future`.split(/\s+/).filter(Boolean)
);

// Distinctive words from a startup's description ("what problem it solves").
export function descriptionKeywords(text) {
  return [...new Set(normName(text).split(' ').filter((w) => w.length >= 4 && !GENERIC.has(w)))].slice(0, 12);
}

// Small startups with a one-word name (e.g. "Hopper", "Cedar") often share it
// with a bigger company, so their board must also mention what they do.
export function needsDescriptionCheck(company) {
  return !company.isUnicorn && !normName(company.name).includes(' ') && descriptionKeywords(company.description).length > 0;
}

// At least two distinctive words from the description must show up in the roles
// (one if the description only has one distinctive word).
function descriptionMentioned(company, roles) {
  const text = ` ${normName(roles.map((r) => `${r.title || ''} ${r.team || ''} ${r.text || ''}`).join(' '))} `;
  const words = descriptionKeywords(company.description).filter((k) => k.length >= 5);
  const hits = words.filter((k) => text.includes(` ${k.slice(0, Math.max(4, k.length - 2))}`)).length;
  return hits >= Math.min(2, words.length) && hits > 0;
}

// Decides whether a board found by guessing its name belongs to `company`
// ({ name, country, countryPretty, city, description, isUnicorn }).
// A small startup with a one-word name also needs its description in the roles.
//   verified: the board names the company AND its roles are in the company's country
//   review:   one of the two holds; an admin decides
//   null:     neither; ignore it
export function verifyBoard(company, { boardName = null, roles = [] }) {
  const named =
    (boardName && (normName(boardName) === normName(company.name) || nameMentioned(boardName, company.name))) ||
    roles.some((r) => (r.company_name && normName(r.company_name) === normName(company.name)) || nameMentioned(r.text || '', company.name));
  const located = roles.some((r) => placeMatches(`${r.location || ''} ${r.country || ''}`, company));
  const allRemote = roles.length > 0 && roles.every((r) => r.remote);
  if (named && (located || allRemote)) {
    if (needsDescriptionCheck(company) && !descriptionMentioned(company, roles)) {
      return { status: 'review', evidence: 'name matches, but the roles don’t mention what this startup does' };
    }
    return { status: 'verified', evidence: located ? 'name + location' : 'name, all remote' };
  }
  if (named || located) return { status: 'review', evidence: named ? 'name only' : 'location only' };
  return null;
}

// ---------- Role type and country ----------

export const ROLE_KINDS = [
  ['engineering', 'Engineering'],
  ['product', 'Product'],
  ['design', 'Design'],
  ['data', 'Data & AI'],
  ['sales', 'Sales & partnerships'],
  ['marketing', 'Marketing & growth'],
  ['operations', 'Operations & strategy'],
  ['customer', 'Customer'],
  ['finance', 'Finance & legal'],
  ['people', 'People & HR'],
  ['other', 'Other'],
];

const KIND_RULES = [
  ['design', /\b(designer|design lead|head of design|ux|ui\/ux|ui|illustrator|creative director|visual)\b/],
  ['marketing', /\bproduct marketing\b/],
  ['product', /\b(product manager|product owner|product lead|head of product|vp product|apm|associate product|group product|chief product|product management|technical program manager)\b/],
  ['marketing', /\b(marketing|growth|brand|content|seo|sem|social media|community|communications|pr|copywriter)\b/],
  ['data', /\b(data|analytics|machine learning|ml|ai engineer|ai|scientist|research scientist|nlp|computer vision|deep learning|llm)\b/],
  ['engineering', /\b(engineer|engineering|developer|sde|swe|devops|sre|qa|test|tester|architect|backend|frontend|front end|full stack|fullstack|mobile|android|ios|platform|security|infrastructure|firmware|embedded|programmer|technical lead|tech lead|cto)\b/],
  ['sales', /\b(sales|account executive|business development|bd|bdr|sdr|partnerships?|account manager|key account|pre sales|presales|relationship manager|alliances)\b/],
  ['customer', /\b(customer success|customer support|support|customer experience|cx|customer service|onboarding specialist|implementation)\b/],
  ['finance', /\b(finance|financial|accounting|accountant|controller|tax|legal|counsel|lawyer|compliance|risk|audit|treasury|fp a|fpa|payroll)\b/],
  ['people', /\b(hr|human resources|people|talent|recruit|recruiter|recruiting|hrbp|culture)\b/],
  ['operations', /\b(operations|ops|supply|logistics|program manager|project manager|strategy|strategic|business analyst|chief of staff|founder s office|founders office|procurement|category|business operations|bizops|general manager|city lead|warehouse)\b/],
];

export function roleKind(title, team = '') {
  const t = ` ${normName(title)} `;
  for (const [kind, re] of KIND_RULES) if (re.test(t)) return kind;
  const d = ` ${normName(team)} `;
  for (const [kind, re] of KIND_RULES) if (re.test(d)) return kind;
  return 'other';
}

// Best guess at the Atlas country name for a role, from its location text.
// `countries` is the list of Atlas country names; `pretty` maps them to display names.
export function roleCountry(role, countries, pretty = (c) => c) {
  const text = `${role.location || ''} ${role.country || ''}`;
  if (INDIA_PLACES.test(text)) return 'India';
  if (/\b(united states|usa|u\.s\.|san francisco|new york|seattle|austin|boston|chicago|los angeles)\b/i.test(text)) {
    return 'United States of America';
  }
  if (/\b(united kingdom|uk|london|manchester|edinburgh)\b/i.test(text)) return 'United Kingdom';
  if (/\b(singapore)\b/i.test(text)) return 'Singapore';
  if (/\b(dubai|abu dhabi|uae|united arab emirates)\b/i.test(text)) return 'United Arab Emirates';
  for (const c of countries) {
    const names = [c, pretty(c)];
    for (const n of names) {
      if (n.length >= 4 && new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) return c;
    }
  }
  return null;
}
