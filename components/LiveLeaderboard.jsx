'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import VoteButton from './VoteButton';
import { prettyName } from '@/lib/geo';

const POLL_MS = 15000;

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function rank(list, sort) {
  if (sort === 'top') return [...list].sort((a, b) => b.votes - a.votes || new Date(b.created_at) - new Date(a.created_at));
  if (sort === 'merit') return [...list].sort((a, b) => b.merit - a.merit || new Date(b.created_at) - new Date(a.created_at));
  return list; // 'new' and 'discover' keep the server's order
}

// Leaderboard that re-ranks live: your votes move a problem up immediately,
// and everyone else's votes arrive every few seconds.
export default function LiveLeaderboard({ initial, sort, query, formula }) {
  const router = useRouter();
  const [items, setItems] = useState(() => rank(initial, sort));
  const [moves, setMoves] = useState({}); // id -> places moved (+ up, - down)
  const [live, setLive] = useState(true);
  const nodes = useRef(new Map());
  const before = useRef(null);

  // Capture positions before a re-rank, then animate from old to new (FLIP).
  const reorder = useCallback(
    (updater) => {
      const pos = new Map();
      nodes.current.forEach((el, id) => el && pos.set(id, el.getBoundingClientRect().top));
      before.current = pos;
      setItems((prev) => {
        const next = rank(updater(prev), sort);
        const oldIndex = new Map(prev.map((p, i) => [p.id, i]));
        const changed = {};
        next.forEach((p, i) => {
          const was = oldIndex.get(p.id);
          if (was !== undefined && was !== i) changed[p.id] = was - i;
        });
        if (Object.keys(changed).length) {
          setMoves((m) => ({ ...m, ...changed }));
          setTimeout(() => setMoves((m) => {
            const copy = { ...m };
            Object.keys(changed).forEach((id) => delete copy[id]);
            return copy;
          }), 3500);
        }
        return next;
      });
    },
    [sort]
  );

  useLayoutEffect(() => {
    const pos = before.current;
    if (!pos) return;
    before.current = null;
    nodes.current.forEach((el, id) => {
      if (!el || !pos.has(id)) return;
      const delta = pos.get(id) - el.getBoundingClientRect().top;
      if (!delta) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = '';
      });
    });
  }, [items]);

  const onVoted = useCallback(
    (id, votes) => reorder((prev) => prev.map((p) => (p.id === id ? { ...p, votes } : p))),
    [reorder]
  );

  // Pull everyone's latest votes while the tab is visible.
  useEffect(() => {
    if (!live) return;
    let stopped = false;
    async function poll() {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/problems?${query}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { problems } = await res.json();
        if (stopped || !problems) return;
        const latest = new Map(problems.map((p) => [p.id, p]));
        reorder((prev) => {
          const known = new Set(prev.map((p) => p.id));
          const updated = prev.map((p) => (latest.has(p.id) ? { ...p, votes: latest.get(p.id).votes, comments: latest.get(p.id).comments, builders: latest.get(p.id).builders, merit: latest.get(p.id).merit, views: latest.get(p.id).views } : p));
          // Discover is a fresh shuffle each visit: update numbers, don't add or reorder.
          const added = sort === 'discover' ? [] : problems.filter((p) => !known.has(p.id));
          return [...updated, ...added];
        });
      } catch {}
    }
    const timer = setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [live, query, reorder]);

  return (
    <div className="mt-6">
      {sort === 'merit' && (
        <p className="mb-3 rounded-lg bg-paper2/60 p-3 text-xs text-ink2">
          <span className="font-semibold text-ink">Atlas score</span> ranks problems by real activity: {formula}.
        </p>
      )}
      {sort === 'discover' && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper2/60 p-3 text-xs text-ink2">
          <span>
            <span className="font-semibold text-ink">Discover</span> shuffles problems every visit. Higher Atlas scores
            show up near the top more often, so new ideas still get seen.
          </span>
          <button onClick={() => router.refresh()} className="btn-ghost px-3 py-1.5 text-xs">🎲 Shuffle again</button>
        </div>
      )}
      {(sort === 'top' || sort === 'merit') && (
        <div className="mb-3 flex items-center justify-between text-xs text-ink2">
          <span className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${live ? 'animate-pulse bg-moss' : 'bg-ink2/40'}`} />
            {live ? 'Live: ranks update as people vote' : 'Live updates paused'}
          </span>
          <button onClick={() => setLive((l) => !l)} className="underline hover:text-ink">
            {live ? 'Pause' : 'Resume'}
          </button>
        </div>
      )}
      <ol className="space-y-3">
        {items.map((p, i) => {
          const moved = moves[p.id];
          return (
            <li
              key={p.id}
              ref={(el) => (el ? nodes.current.set(p.id, el) : nodes.current.delete(p.id))}
              className={`card flex gap-4 p-4 ${moved > 0 ? 'ring-2 ring-moss/40' : ''}`}
            >
              <span className="flex w-9 shrink-0 flex-col items-end pt-1 font-mono text-sm text-ink2">
                {sort === 'top' || sort === 'merit' ? `#${i + 1}` : ''}
                {moved ? (
                  <span className={`text-[10px] font-semibold ${moved > 0 ? 'text-moss' : 'text-signal'}`}>
                    {moved > 0 ? `▲${moved}` : `▼${-moved}`}
                  </span>
                ) : null}
              </span>
              <VoteButton id={p.id} votes={p.votes} onVoted={onVoted} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold leading-snug">
                  <Link href={`/problems/${p.id}`} className="hover:text-signal">{p.title}</Link>
                </h2>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink2">
                  {p.industry} · {prettyName(p.country)} · {timeAgo(p.created_at)}
                  {p.author ? ` · by ${p.author}` : ''}
                  {` · 👁 ${p.views || 0}`}
                  {typeof p.merit === 'number' ? ` · score ${Math.round(p.merit)}` : ''}
                </p>
                {p.details && <p className="mt-2 text-sm text-ink2">{p.details}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <Link href={`/problems/${p.id}`} className="font-semibold text-signal hover:underline">
                    {p.comments > 0 ? `💡 ${p.comments} suggestion${p.comments === 1 ? '' : 's'} →` : '💡 Suggest a solution →'}
                  </Link>
                  <Link href={`/problems/${p.id}#build`} className="font-semibold text-ink hover:text-signal">
                    🚀 {p.builders > 0 ? `${p.builders} want${p.builders === 1 ? 's' : ''} to build this` : 'Want to build this?'}
                  </Link>
                  {p.source && (
                    <span className="font-mono text-[11px] text-ink2">
                      Source:{' '}
                      {p.source_url ? (
                        <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">{p.source}</a>
                      ) : (
                        p.source
                      )}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
