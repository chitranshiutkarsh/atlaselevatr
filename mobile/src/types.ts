// Shapes returned by the Atlas API (atlaselevatr.in/api/...).

export type Stage = 'open' | 'validated' | 'claimed' | 'studio';
export type Option = [string, string]; // [key, label]

export type Meta = {
  version: number;
  site: { name: string; url: string; parent: string; tagline: string };
  industries: string[];
  countries: { name: string; label: string; continent: string }[];
  continents: { name: string; slug: string }[];
  limits: {
    titleMin: number;
    titleMax: number;
    detailsMax: number;
    solutionMin: number;
    solutionMax: number;
    nameMax: number;
  };
  validation: { proofs: number; builders: number };
  stages: Record<Stage, { label: string; tone: string; hint: string }>;
  builder: { stages: Option[]; commitment: Option[]; needs: Option[] };
  proof: { frequency: Option[]; pay: Option[]; who: Option[] };
  reportReasons: Option[];
  links: { privacy: string; about: string; studio: string; contact: string };
};

export type ProblemSummary = {
  id: number;
  title: string;
  details?: string | null;
  industry: string;
  country: string;
  continent?: string;
  author?: string | null;
  votes: number;
  views?: number;
  created_at: string;
  source?: string | null;
  comments?: number;
  solutions?: number;
  builders?: number;
  proofs?: number;
  studio?: boolean;
  validated?: boolean;
  merit?: number;
  stage?: Stage;
  // Gaps only
  world?: number;
  local?: number;
  verdict?: Verdict | null;
};

export type Verdict = { kind: 'open' | 'gap' | 'thin' | 'crowded'; label: string; text: string };

export type Startup = {
  id: number;
  name: string;
  country: string;
  continent?: string;
  city?: string | null;
  industry: string;
  sector?: string | null;
  problem: string;
  website?: string | null;
  is_unicorn: boolean;
  linked?: boolean;
  last_funded?: number | null;
};

export type Story = {
  id: number;
  story: string;
  frequency: string;
  pay: string;
  who: string;
  city?: string | null;
  author?: string | null;
  created_at: string;
};

export type ProofSummary = {
  total: number;
  frequency: Record<string, number>;
  pay: Record<string, number>;
  who: Record<string, number>;
  stories: Story[];
};

export type Comment = {
  id: number;
  kind: 'solution' | 'comment';
  body: string;
  author?: string | null;
  helpful: number;
  created_at: string;
};

export type Builder = {
  id: number;
  problem_id: number;
  first_name: string;
  city?: string | null;
  stage: string;
  commitment: string;
  needs?: string | null;
  headline?: string | null;
  studio_pick: boolean;
  created_at: string;
  mine?: boolean;
  updates?: { id: number; body: string; created_at: string }[] | number;
  // Builders board only
  problem?: string;
  country?: string;
  industry?: string;
  votes?: number;
  proofs?: number;
};

export type Job = {
  id: number;
  title: string;
  company: string;
  location?: string | null;
  source: string;
  url: string;
  focus?: string | null;
  industry?: string | null;
  problem_id?: number | null;
  problem?: string | null;
  created_at?: string;
};

export type ProblemDetail = {
  problem: ProblemSummary & {
    solution?: string | null;
    source_url?: string | null;
    country_label: string;
    stage: Stage;
  };
  me: { voted: boolean; storied: boolean; helped: number[] };
  proof: ProofSummary;
  comments: Comment[];
  builders: Builder[];
  startups: {
    local: Startup[];
    world: Startup[];
    totals: { local: number; world: number };
    verdict: Verdict | null;
  } | null;
  jobs: Job[];
};

export type CountryStats = { companies: number; unicorns: number; problems: number; votes: number; gaps: number };

export type Home = {
  stats: {
    problems: number;
    votes: number;
    countries: number;
    companies: number;
    members: number;
    proofs: number;
    validated: number;
    claimed: number;
    industries: { industry: string; problems: number; votes: number }[];
  };
  countries: Record<string, CountryStats>;
};

export type Invite = { code: string; name: string; visits: number; joined: number; problems: number };

export type Me = {
  invite: Invite | null;
  raised: ProblemSummary[];
  faced: ProblemSummary[];
  builds: { id: number; problem_id: number; stage: string; status: string; is_public: boolean; problem: string }[];
};

export type ReportKind = 'problem' | 'comment' | 'story' | 'builder';
