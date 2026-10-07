export const SITE = {
  name: 'Atlas',
  domain: 'atlaselevatr.in',
  parent: process.env.NEXT_PUBLIC_PARENT_BRAND || 'Elevtr Ventures',
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
