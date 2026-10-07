import { cookies } from 'next/headers';
import InviteCard from '@/components/InviteCard';
import SetupNotice from '@/components/SetupNotice';
import { getInviteForVisitor, topInviters } from '@/lib/queries';
import { SITE } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invite' };

export default async function InvitePage() {
  const visitor = cookies().get('av_vid')?.value || null;
  let mine;
  let leaders;
  try {
    [mine, leaders] = await Promise.all([getInviteForVisitor(visitor), topInviters(10)]);
  } catch (err) {
    console.error(err);
    return <SetupNotice error={err.message} />;
  }

  return (
    <div className="pt-12">
      <p className="label">Share codes</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Bring your people in</h1>
      <p className="mt-3 max-w-2xl text-ink2">
        Get your personal code in five seconds. Everyone who joins through your link, and every problem they add,
        counts toward you on the inviter board.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <InviteCard initial={mine} siteUrl={SITE.url} />

        <aside className="card p-5">
          <p className="label">Top inviters</p>
          {leaders.length === 0 ? (
            <p className="mt-3 text-sm text-ink2">No one yet. Claim the top spot.</p>
          ) : (
            <ol className="mt-3 divide-y divide-ink/10">
              {leaders.map((l, i) => (
                <li key={l.code} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-3">
                    <span className="w-5 font-mono text-xs text-ink2">{i + 1}</span>
                    <span className="font-medium">{l.name}</span>
                  </span>
                  <span className="font-mono text-xs text-ink2">
                    {l.joined} joined · {l.problems} problems
                  </span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
