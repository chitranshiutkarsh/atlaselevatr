'use client';

import { useEffect, useRef, useState } from 'react';

const KEY = 'atlas_helpful';

function readMarked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Comments({ problemId, initial }) {
  const [comments, setComments] = useState(initial);
  const [marked, setMarked] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ kind: 'solution', body: '', author: '', hp: '' });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const started = useRef(0);

  useEffect(() => {
    started.current = Date.now();
    setMarked(readMarked());
  }, []);

  async function post(e) {
    e.preventDefault();
    setStatus({ state: 'busy', message: '' });
    try {
      const res = await fetch(`/api/problems/${problemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, t: started.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      if (data.comment) {
        setComments((list) => [...list, { ...data.comment, created_at: new Date().toISOString() }]);
      }
      setForm((f) => ({ ...f, body: '' }));
      started.current = Date.now();
      setStatus({ state: 'done', message: 'Posted. Thanks for helping solve this.' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  }

  async function helpful(id) {
    if (marked.has(id)) return;
    const next = new Set(marked);
    next.add(id);
    setMarked(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(Array.from(next).slice(-500)));
    } catch {}
    setComments((list) => list.map((c) => (c.id === id ? { ...c, helpful: c.helpful + 1 } : c)));
    try {
      const res = await fetch(`/api/comments/${id}/helpful`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) setComments((list) => list.map((c) => (c.id === id ? { ...c, helpful: data.helpful } : c)));
    } catch {}
  }

  const solutions = comments.filter((c) => c.kind === 'solution').length;
  const shown = comments
    .filter((c) => filter === 'all' || c.kind === filter)
    .sort((a, b) => b.helpful - a.helpful || new Date(a.created_at) - new Date(b.created_at));

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">How would you solve it?</h2>
        <div className="flex gap-1.5">
          {[
            ['all', `All (${comments.length})`],
            ['solution', `Solutions (${solutions})`],
            ['comment', `Comments (${comments.length - solutions})`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={filter === key ? 'chip-on' : 'chip'}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={post} className="card mt-4 space-y-3 p-5">
        <div className="flex gap-2">
          {[
            ['solution', '💡 Suggest a solution'],
            ['comment', '💬 Comment'],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => setForm((f) => ({ ...f, kind: key }))}
              className={form.kind === key ? 'chip-on' : 'chip'}
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          rows={4}
          className="input"
          placeholder={
            form.kind === 'solution'
              ? 'How would you solve this? Products, approaches, people who could help…'
              : 'Add context, your experience with this problem, or a question'
          }
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          minLength={10}
          maxLength={2000}
          required
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className="input sm:max-w-xs"
            placeholder="Your name (optional)"
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            maxLength={60}
          />
          <div className="hidden" aria-hidden="true">
            <input tabIndex={-1} autoComplete="off" value={form.hp} onChange={(e) => setForm((f) => ({ ...f, hp: e.target.value }))} />
          </div>
          <button className="btn-primary sm:ml-auto" disabled={status.state === 'busy'}>
            {status.state === 'busy' ? 'Posting…' : 'Post'}
          </button>
        </div>
        {status.message && (
          <p className={`text-sm ${status.state === 'error' ? 'text-signal' : 'text-moss'}`}>{status.message}</p>
        )}
      </form>

      {shown.length === 0 ? (
        <p className="mt-6 text-ink2">No suggestions yet. Be the first to propose a solution.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((c) => (
            <li key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink2">
                  <span className={c.kind === 'solution' ? 'text-signal' : ''}>{c.kind === 'solution' ? '💡 Solution' : '💬 Comment'}</span>
                  {' · '}
                  {c.author || 'Anonymous'} · {timeAgo(c.created_at)}
                </p>
                <button
                  onClick={() => helpful(c.id)}
                  disabled={marked.has(c.id)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-xs transition ${
                    marked.has(c.id) ? 'border-moss bg-moss/10 text-moss' : 'border-ink/15 text-ink2 hover:border-moss hover:text-moss'
                  }`}
                  aria-label="Mark as helpful"
                >
                  👍 {c.helpful}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
