import { dataStatus } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = { title: 'Status', robots: { index: false, follow: false } };

// Public health check: shows whether each one-time data load has finished.
export default async function StatusPage() {
  let status;
  let error = null;
  try {
    status = await dataStatus();
  } catch (err) {
    error = err.message;
  }
  return (
    <div className="mx-auto max-w-xl pt-12">
      <h1 className="font-display text-3xl font-semibold">System status</h1>
      <p className="mt-1 font-mono text-xs text-ink2">
        build {(process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7)} · rendered {new Date().toISOString()}
      </p>
      {error ? (
        <p className="mt-4 rounded-lg bg-signal/10 p-4 font-mono text-sm text-signal">Database error: {error}</p>
      ) : (
        <>
          <dl className="card mt-6 grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            {Object.entries(status.counts).map(([k, v]) => (
              <div key={k}>
                <dt className="label">{k}</dt>
                <dd className="font-display text-2xl font-semibold">{v.toLocaleString('en-IN')}</dd>
              </div>
            ))}
          </dl>
          <ul className="card mt-4 divide-y divide-ink/10 p-2">
            {status.steps.map((s) => (
              <li key={s.key} className="flex items-start justify-between gap-3 px-3 py-2 font-mono text-sm">
                <span>{s.key}</span>
                <span className={s.state === 'done' ? 'text-moss' : s.state === 'failed' ? 'text-signal' : 'text-ink2'}>
                  {s.state}
                  {s.error && <span className="block max-w-xs text-xs">{s.error}</span>}
                </span>
              </li>
            ))}
          </ul>
          {status.loading && <p className="mt-3 text-sm text-ink2">Data is loading right now. Refresh in a minute.</p>}
        </>
      )}
    </div>
  );
}
