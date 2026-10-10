import Link from 'next/link';
import { redirect } from 'next/navigation';
import MySettings from '@/components/MySettings';
import SetupNotice from '@/components/SetupNotice';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getDigest } from '@/lib/digest';
import { VALIDATION } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const metadata = { title: 'My Atlas', robots: { index: false } };

export default async function MePage({ searchParams }) {
  let user;
  let stories;
  let claims;
  let votes;
  let digest;
  try {
    user = await getUser();
    if (user) {
      const sql = await db();
      [stories, claims, [{ votes }], digest] = await Promise.all([
        sql`SELECT pp.id, pp.story, pp.created_at, p.id AS problem_id, p.title,
            (SELECT count(*)::int FROM problem_proofs x WHERE x.problem_id = p.id AND x.status = 'live') AS proofs
          FROM problem_proofs pp JOIN problems p ON p.id = pp.problem_id
          WHERE pp.user_id = ${user.id} AND pp.status = 'live' ORDER BY pp.created_at DESC LIMIT 50`,
        sql`SELECT b.id, b.stage, b.status, b.is_public, p.id AS problem_id, p.title, p.country,
            (SELECT count(*)::int FROM builder_updates u WHERE u.builder_id = b.id) AS updates
          FROM builder_interests b JOIN problems p ON p.id = b.problem_id
          WHERE b.user_id = ${user.id} OR lower(b.email) = lower(${user.email})
          ORDER BY b.created_at DESC LIMIT 50`,
        sql`SELECT count(*)::int AS votes FROM votes WHERE user_id = ${user.id}`,
        getDigest(user.id),
      ]);
    }
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }
  if (!user) redirect('/signin');

  const notice = searchParams.digest === 'on' ? 'Your weekly digest is confirmed.' : searchParams.digest === 'off' ? 'You are unsubscribed from the digest.' : null;

  return (
    <div className="pt-12">
      <p className="label">My Atlas</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">{user.email}</h1>
      {notice && <p className="mt-4 rounded-lg bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">{notice}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Votes', votes],
              ['Stories shared', stories.length],
              ['Problems claimed', claims.length],
            ].map(([l, v]) => (
              <div key={l} className="card p-4">
                <p className="label">{l}</p>
                <p className="font-display text-3xl font-semibold">{v}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="font-display text-2xl font-semibold">Problems I&apos;m building</h2>
            {claims.length === 0 ? (
              <p className="mt-2 text-ink2">
                None yet. <Link href="/gaps" className="font-semibold text-signal hover:underline">Find a gap to claim →</Link>
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {claims.map((c) => (
                  <li key={c.id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
                    <Link href={`/problems/${c.problem_id}#builders`} className="font-semibold hover:text-signal">{c.title}</Link>
                    <span className="font-mono text-[11px] uppercase text-ink2">
                      {c.is_public ? 'Public' : 'Private'} · {c.updates} updates · {c.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Problems I face</h2>
            {stories.length === 0 ? (
              <p className="mt-2 text-ink2">
                Tap “This happens to me” on any problem you face. <Link href="/problems" className="font-semibold text-signal hover:underline">Browse problems →</Link>
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {stories.map((s) => (
                  <li key={s.id} className="card p-4">
                    <Link href={`/problems/${s.problem_id}`} className="font-semibold hover:text-signal">{s.title}</Link>
                    <p className="mt-1 text-sm text-ink2">“{s.story}”</p>
                    <p className="mt-1 font-mono text-[11px] uppercase text-ink2">
                      {s.proofs} of {VALIDATION.proofs} stories needed to validate
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          <MySettings digest={digest} />
        </aside>
      </div>
    </div>
  );
}
