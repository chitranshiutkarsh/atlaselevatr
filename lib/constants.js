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
  'HR & Work',
  'Media & Creators',
  'Real Estate & Housing',
  'Government & Civic',
  'Other',
];

export const JOB_SOURCES = ['LinkedIn', 'IIM Jobs', 'Company site', 'Other'];

export const MAX_ACTIVE_JOBS = 50;

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
