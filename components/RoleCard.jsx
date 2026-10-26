import Link from 'next/link';
import { ROLE_KINDS } from '@/lib/careers-core';
import { prettyName } from '@/lib/geo';

const KIND = Object.fromEntries(ROLE_KINDS);

export function ago(iso) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function where(role) {
  if (role.remote && (!role.location || /remote/i.test(role.location))) return 'Remote';
  const loc = role.location || (role.country ? prettyName(role.country) : null);
  return [loc, role.remote ? 'Remote OK' : null].filter(Boolean).join(' · ') || 'Location not listed';
}

// One open role. Shows the problem its startup works on, so people see what
// they'd be solving before they apply.
export default function RoleCard({ role, showProblem = true, compact = false }) {
  const posted = ago(role.posted_at);
  return (
    <li className={`card flex min-w-0 flex-col ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold leading-snug`}>{role.title}</h3>
          <p className="mt-0.5 text-ink2">
            {role.company}
            {role.is_unicorn && (
              <span className="ml-1.5 rounded-full bg-signal/10 px-1.5 py-0.5 align-middle font-mono text-[9px] uppercase text-signal">Unicorn</span>
            )}
          </p>
        </div>
        {role.kind && role.kind !== 'other' && (
          <span className="shrink-0 rounded-full bg-paper2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink2">
            {KIND[role.kind] || role.kind}
          </span>
        )}
      </div>
      {showProblem && role.problem && (
        <p className="mt-3 text-sm">
          <span className="font-mono text-[10px] uppercase tracking-wide text-ink2">Works on</span>{' '}
          <Link href={`/problems/${role.problem_id}`} className="font-semibold hover:text-signal">{role.problem}</Link>
          {role.votes > 0 && <span className="text-ink2"> · ▲ {role.votes.toLocaleString('en-IN')} face it</span>}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="min-w-0 truncate font-mono text-xs text-ink2">
          {where(role)}
          {posted ? ` · ${posted}` : ''}
        </span>
        <a href={role.url} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0 px-4 py-2">
          Apply ↗
        </a>
      </div>
    </li>
  );
}
