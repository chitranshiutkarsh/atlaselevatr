import SetupNotice from '@/components/SetupNotice';
import { listJobs } from '@/lib/queries';
import { MAX_ACTIVE_JOBS } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Problem-solving jobs' };

const SEARCHES = [
  { label: 'Strategy roles on LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=strategy&location=India' },
  { label: 'Founder’s office on LinkedIn', url: "https://www.linkedin.com/jobs/search/?keywords=founder%27s%20office&location=India" },
  { label: 'Browse IIM Jobs', url: 'https://www.iimjobs.com/' },
];

export default async function JobsPage({ searchParams }) {
  let jobs;
  try {
    jobs = await listJobs();
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
  const sources = Array.from(new Set(jobs.map((j) => j.source)));
  const source = sources.includes(searchParams.source) ? searchParams.source : null;
  const shown = source ? jobs.filter((j) => j.source === source) : jobs;

  return (
    <div className="pt-12">
      <p className="label">Curated · max {MAX_ACTIVE_JOBS} at a time</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Get paid to solve problems</h1>
      <p className="mt-3 max-w-2xl text-ink2">
        Hand-picked strategy, founder&apos;s office and problem-solving roles from LinkedIn, IIM Jobs and company sites.
        Click apply to go straight to the original posting.
      </p>

      {sources.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <a href="/jobs" className={!source ? 'chip-on' : 'chip'}>All ({jobs.length})</a>
          {sources.map((s) => (
            <a key={s} href={`/jobs?source=${encodeURIComponent(s)}`} className={source === s ? 'chip-on' : 'chip'}>
              {s}
            </a>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="card mt-8 p-8">
          <p className="font-display text-2xl font-semibold">New roles are on their way</p>
          <p className="mt-2 text-ink2">While we curate the list, these searches are a good start:</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {SEARCHES.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {shown.map((job) => (
            <li key={job.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold leading-snug">{job.title}</h2>
                  <p className="mt-0.5 text-ink2">{job.company}</p>
                </div>
                <span className="shrink-0 rounded-full bg-paper2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink2">
                  {job.source}
                </span>
              </div>
              {job.focus && <p className="mt-3 text-sm">{job.focus}</p>}
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="font-mono text-xs text-ink2">{job.location || 'Location flexible'}</span>
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-primary px-4 py-2">
                  Apply ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
