import { prettyName } from '@/lib/geo';

// A startup the engine (or the community) matched to a problem.
export default function StartupMatchCard({ c }) {
  return (
    <li className="rounded-lg border border-ink/10 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">
          {c.website ? (
            <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-signal">{c.name}</a>
          ) : (
            c.name
          )}
          {c.is_unicorn && (
            <span className="ml-1.5 rounded-full bg-signal/10 px-1.5 py-0.5 align-middle font-mono text-[9px] uppercase text-signal">
              Unicorn
            </span>
          )}
          {c.linked && (
            <span className="ml-1.5 rounded-full bg-moss/10 px-1.5 py-0.5 align-middle font-mono text-[9px] uppercase text-moss">
              Added by community
            </span>
          )}
        </p>
        <span className="shrink-0 font-mono text-[10px] uppercase text-ink2">{c.industry}</span>
      </div>
      <p className="mt-1 line-clamp-3 text-sm text-ink2">{c.problem}</p>
      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-ink2/80">
        {[c.city, prettyName(c.country), c.sector].filter(Boolean).join(' · ')}
      </p>
    </li>
  );
}
