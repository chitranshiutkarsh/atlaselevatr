export const SITE = {
  name: 'Atlas',
  domain: 'atlaselevatr.in',
  parent: process.env.NEXT_PUBLIC_PARENT_BRAND || 'Elevatr Ventures',
  tagline: 'Every unsolved problem on Earth, mapped and ranked.',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://atlaselevatr.in').replace(/\/$/, ''),
};

export const INDUSTRIES = [
  'Fintech',
  'Health',
  'Education',
  'Climate & Energy',
  'Mobility',
  'Logistics',
  'Commerce',
  'Food & Agri',
  'AI & Software',
  'SaaS & B2B',
  'HR & Work',
  'Media & Creators',
  'Gaming & Entertainment',
  'Travel & Hospitality',
  'Real Estate & Housing',
  'Government & Civic',
  'Other',
];

export const JOB_SOURCES = ['LinkedIn', 'IIM Jobs', 'Company site', 'Other'];

export const MAX_ACTIVE_JOBS = 50;

export const DIRECTORY_PAGE_SIZE = 24;

export const LIMITS = {
  titleMin: 8,
  titleMax: 140,
  detailsMax: 1000,
  solutionMin: 10,
  solutionMax: 1000,
  nameMax: 60,
  submissionsPerHour: 5,
  invitesPerHour: 5,
  votesPerIpPerProblem: 10,
};

// "Want to build this?" form options.
export const BUILDER_STAGES = [
  ['idea', 'Just an idea'],
  ['researching', 'Talking to users'],
  ['prototype', 'Building a prototype'],
  ['launched', 'Launched, early users'],
  ['revenue', 'Making revenue'],
];
export const BUILDER_COMMITMENT = [
  ['full-time', 'Full-time'],
  ['part-time', 'Part-time / nights & weekends'],
  ['exploring', 'Just exploring'],
];
export const BUILDER_NEEDS = [
  ['cofounder', 'A co-founder'],
  ['validation', 'Validating the idea'],
  ['product', 'Building the product'],
  ['gtm', 'Finding customers'],
  ['funding', 'Funding'],
  ['studio', 'Full studio support'],
];
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'in studio', 'not a fit'];

// "This happens to me" proof options.
export const PROOF_FREQUENCY = [
  ['daily', 'Every day'],
  ['weekly', 'Every week'],
  ['monthly', 'Every month'],
  ['rarely', 'A few times a year'],
];
export const PROOF_PAY = [
  ['none', "Wouldn't pay"],
  ['small', 'A little (under ₹200 / $5 a month)'],
  ['medium', 'Some (₹200–1,000 / $5–20 a month)'],
  ['high', 'A lot (₹1,000+ / $20+ a month)'],
];
export const PROOF_WHO = [
  ['consumer', 'Me, personally'],
  ['family', 'My family'],
  ['business', 'My business'],
  ['employer', 'The company I work at'],
  ['student', 'Me, as a student'],
];

// A problem counts as validated once this many people have shared a first-hand
// story about it. This is the north-star metric.
export const VALIDATION = { proofs: 10, builders: 1 };

// Where a problem is on the Atlas loop: Open → Validated → Claimed → In studio.
// Each stage is the furthest step it has reached.
export const STAGES = {
  open: { label: 'Open', tone: 'open', hint: 'People face it. Not enough stories to validate yet.' },
  validated: { label: 'Validated', tone: 'validated', hint: `${VALIDATION.proofs}+ first-hand stories. Ready for a builder.` },
  claimed: { label: 'Claimed', tone: 'claimed', hint: 'Someone is building it.' },
  studio: { label: 'In studio', tone: 'studio', hint: 'Backed by the venture studio.' },
};

export function problemStage({ proofs = 0, builders = 0, studio = false } = {}) {
  if (studio) return 'studio';
  if (builders >= VALIDATION.builders) return 'claimed';
  if (proofs >= VALIDATION.proofs) return 'validated';
  return 'open';
}
