import { SITE } from '@/lib/constants';

export const metadata = {
  title: 'Privacy',
  description: `How ${SITE.name} handles your data on ${SITE.domain} and in the Atlas phone app.`,
};

const CONTACT = process.env.CONTACT_EMAIL || `hello@${SITE.domain}`;
const UPDATED = '26 October 2026';

const SECTIONS = [
  {
    title: 'What Atlas is',
    body: [
      `${SITE.name} (${SITE.domain} and the Atlas app for iPhone and Android) maps problems people face, ranks them by how many people face them, and shows which startups already work on them. It is run by ${SITE.parent}.`,
      'You can use Atlas without an account. Nothing you do on Atlas is sold, and Atlas shows no ads.',
    ],
  },
  {
    title: 'What we collect',
    list: [
      ['A random device id', 'On the website this is a cookie; in the app it is a random code stored on your phone. It lets us count one vote per person and find your own invite code. It is not linked to your name unless you give us one.'],
      ['A scrambled form of your IP address', 'We never store your IP address. We keep a salted one-way hash of it, only to stop spam and limit how often one network can post.'],
      ['What you post', 'Problems, stories ("I face this"), solutions, comments and startups you add are public. The name you type with them is shown; leave it blank to post anonymously.'],
      ['Builder details', 'If you say you want to build a solution, your name, email, phone, LinkedIn, city and pitch go to the Atlas team only. If you choose to be shown publicly, only your first name, city, stage, needs and headline are shown.'],
      ['Your email, if you give it', 'Used only for what you asked: a sign-in link, the weekly digest, or updates on a problem you follow. Every email has an unsubscribe link.'],
      ['Reports', 'If you report something in the app, we keep the report and your reason so the team can review it.'],
    ],
  },
  {
    title: 'What we do not collect',
    body: [
      'No contacts, photos, location, microphone or camera access. No advertising ids, no third-party trackers and no analytics SDKs in the app.',
    ],
  },
  {
    title: 'Who we share it with',
    body: [
      'Only the services that run Atlas: Vercel (hosting), Neon (database) and Resend (email). They process data for us and may not use it for anything else. Builder contact details are never shown publicly or passed to anyone outside the Atlas team without the builder’s agreement.',
    ],
  },
  {
    title: 'Keeping it and deleting it',
    body: [
      `Write to ${CONTACT} from the email you used, or quote your invite code, and we will delete what you posted and any details linked to you within 30 days. In the app you can also report anything you see, and items reported by several people are hidden until the team reviews them.`,
      'Uninstalling the app deletes its device id from your phone.',
    ],
  },
  {
    title: 'Children',
    body: ['Atlas is not meant for children under 13, and we do not knowingly collect their data.'],
  },
  {
    title: 'Changes and contact',
    body: [`If this policy changes, we will update this page and the date below. Questions: ${CONTACT}.`],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl pt-12">
      <p className="label">Privacy</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Your data on Atlas</h1>
      <p className="mt-3 text-ink2">Short version: use Atlas anonymously, we keep as little as we can, and we never sell it.</p>
      <div className="mt-10 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
            {s.body?.map((p) => (
              <p key={p} className="mt-3 text-ink2">{p}</p>
            ))}
            {s.list && (
              <ul className="mt-4 space-y-3">
                {s.list.map(([k, v]) => (
                  <li key={k} className="card p-4">
                    <p className="font-semibold">{k}</p>
                    <p className="mt-1 text-sm text-ink2">{v}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <p className="label mt-12">Last updated {UPDATED}</p>
    </div>
  );
}
