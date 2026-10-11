import Link from 'next/link';
import GapBadge from './GapBadge';
import StageBadge from './StageBadge';
import VoteButton from './VoteButton';
import { gapVerdict } from '@/lib/engine';
import { prettyName } from '@/lib/geo';

// Problems ranked by unmet demand (the "Gaps" tab on /problems).
export default function GapList({ gaps }) {
  return (
    <ol className="mt-6 space-y-3">
      {gaps.map((g, i) => {
        const verdict = gapVerdict({ world: g.world, local: g.local }, prettyName(g.country));
        return (
          <li key={g.id} className="card flex gap-4 p-4">
            <span className="w-8 shrink-0 pt-1 text-right font-mono text-sm text-ink2">#{i + 1}</span>
            <VoteButton id={g.id} votes={g.votes} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <GapBadge verdict={verdict} small />
                <StageBadge problem={g} small showOpen={false} />
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink2">{g.industry} · {prettyName(g.country)}</span>
              </div>
              <h2 className="mt-1 text-lg font-semibold leading-snug">
                <Link href={`/problems/${g.id}`} className="hover:text-signal">{g.title}</Link>
              </h2>
              <p className="mt-1 text-sm text-ink2">
                🙋 {g.proofs} {g.proofs === 1 ? 'story' : 'stories'} · 🚀 {g.builders} building · {g.local} startup{g.local === 1 ? '' : 's'} in{' '}
                {prettyName(g.country)}, {g.world} worldwide
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 text-sm">
                <Link href={`/problems/${g.id}#build`} className="font-semibold text-signal hover:underline">🚀 Claim this gap →</Link>
                <Link href={`/problems/${g.id}/startups`} className="font-semibold text-ink hover:text-signal">Who&apos;s solving it elsewhere →</Link>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
