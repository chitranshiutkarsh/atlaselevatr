# Atlas — atlaselevatr.in

The world's unsolved problems, mapped and ranked. An Elevtr Ventures initiative.

- **Atlas map**: World → continent → country. Each layer shows the top unicorns, the problems they solved, and problems people have raised there.
- **Add a problem**: no login or sign-up. Problem, industry, country and how you'd solve it, with spam protection built in.
- **Leaderboard**: problems ranked by votes (one vote per person per problem), with filters and an industry breakdown.
- **Jobs**: up to 50 curated problem-solving roles. Each Apply button opens the original LinkedIn / IIM Jobs posting.
- **Invite codes**: anyone gets a personal share link (`/r/CODE`). Visits, people who join and problems they add are credited to the inviter.
- **Admin** (`/admin`): add/pause/delete jobs, hide or delete problems, add or edit unicorns.

Stack: Next.js 14 (App Router) · Postgres on Neon · Tailwind CSS · deployed on Vercel.

## Deploy (about 5 minutes)

1. **Import to Vercel.** Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, pick `atlaselevatr`, click **Deploy**. The first deploy shows a "Connect the database" page; that's expected.
2. **Add the database.** In the Vercel project: **Storage → Create Database → Neon (Postgres) → Continue**, accept the defaults and connect it to the project. This sets `DATABASE_URL` automatically.
3. **Add settings.** **Settings → Environment Variables**, add:
   | Name | Value |
   |---|---|
   | `ADMIN_PASSWORD` | a strong password, 8+ characters (for `/admin`) |
   | `HASH_SECRET` | any long random text |
   | `NEXT_PUBLIC_SITE_URL` | `https://atlaselevatr.in` |
4. **Redeploy.** **Deployments → ⋯ on the latest → Redeploy.** Tables are created and the starter unicorn list is loaded automatically on the first visit.
5. **Connect the domain.** **Settings → Domains → Add** `atlaselevatr.in` (and `www.atlaselevatr.in`). Vercel shows the DNS records to add at your domain registrar.

## Run locally

```bash
cp .env.example .env.local   # fill in DATABASE_URL from Neon
npm install
npm run dev
```

## Notes

- Jobs are curated by hand in `/admin` because LinkedIn does not allow scraping. The board holds 50 live jobs at most.
- IP addresses are never stored, only a salted hash used for rate limiting.
- The starter unicorn list (`lib/seed.js`) is a starting point. Check and edit it in `/admin`.
- Brand name in the footer comes from `NEXT_PUBLIC_PARENT_BRAND` (default "Elevtr Ventures").
