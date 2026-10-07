// Shown instead of a crash when the database is not connected yet.
export default function SetupNotice({ error }) {
  return (
    <section className="mx-auto mt-16 max-w-xl card p-8">
      <p className="label">Almost there</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Connect the database</h1>
      <p className="mt-3 text-ink2">
        The site is deployed but can&apos;t reach its database. In Vercel, open this project → Storage → connect a
        Neon Postgres database (it sets <code className="font-mono text-sm">DATABASE_URL</code>), then redeploy.
      </p>
      {error && <p className="mt-4 rounded-lg bg-paper2 p-3 font-mono text-xs text-ink2">{error}</p>}
    </section>
  );
}
