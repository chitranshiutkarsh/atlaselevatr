# Atlas — atlaselevatr.in

Find work on the problems you care about. The world's problems, the startups solving them, and their open roles. An Elevatr Ventures initiative.

- **Atlas map**: World → continent → country. Each layer shows the unicorns, the problems they solved, problems people raised there, and every startup in that place by category.
- **Startup directory** (`/startups`): ~9,700 startups: 4,000 Indian (including all 131 Indian unicorns) and 5,700 from other countries (Y Combinator companies and 1,000+ global unicorns). Filter by category, city and search. Founders can list their startup at `/startups/add` (reviewed in `/admin`).
- **Add a problem**: no login or sign-up. Problem, industry, country and how you'd solve it, with spam protection built in.
- **Leaderboard**: problems ranked by votes (one vote per person per problem), with filters and an industry breakdown. Starts with 50+ problems from public sources (Razorpay Fix My Itch, WHO, UN SDGs, World Bank, UNICEF, UNEP).
- **Problem pages** (`/problems/ID`): anyone can suggest a solution or comment, and mark suggestions as helpful.
- **Want to build this?**: on every problem, would-be founders leave their details, stage, commitment and what help they need. Leads land in `/admin` → Builders, with status tracking, notes and CSV export.
- **Status** (`/status`): shows whether each one-time data load has finished.
- **Jobs**: up to 50 curated problem-solving roles. Each Apply button opens the original LinkedIn / IIM Jobs posting.
- **Invite codes**: anyone gets a personal share link (`/r/CODE`). Visits, people who join and problems they add are credited to the inviter.
- **This happens to me** (proof): on every problem, people share a one-line story, how often it happens, whether they'd pay for a fix and who it hits. It also counts as their vote. A problem is **validated** at 10 stories + 1 builder claim (`VALIDATION` in `lib/constants.js`).
- **Startup engine** (`lib/engine.js`): every problem is matched against the ~9,700 startups with Postgres full-text search (keywords from the problem, boosted for same industry, same country and unicorns). Problem pages show "Who's solving this" with a CTA to `/problems/ID/startups` (all matches, grouped by country). It runs automatically when a problem is added. Anyone can add a missing startup there: one already in the directory is linked at once; a new one is reviewed in `/admin` and then joins the main directory, linked to the problem.
- **Gap finder** (`/gaps`): problems ranked by unmet demand: (votes + 2 × stories + 4 × builders) ÷ (1 + startups already working on it in that country). Labels: open whitespace, gap in country, thin, crowded.
- **Claims and Builders board** (`/builders`): "Want to build this?" can be made public. Public builders get a card (first name, city, stage, needs, headline; never contact details), post progress updates from the same browser, and others ask for an intro (handled by the team in `/admin` → Intro requests). Setting a lead to "in studio" shows a studio-pick badge.
- **Share cards**: each problem has a generated image (`opengraph-image.js`) and WhatsApp / LinkedIn / X / copy buttons. Links carry the sharer's invite code.
- **Sign-in and weekly digest**: email magic links (no passwords) at `/signin`, a "My Atlas" page at `/me`, and a weekly email of top problems, new problems and gaps for a chosen country and industries, sent every Monday 9:00 IST by Vercel Cron (`vercel.json`). Needs `RESEND_API_KEY`, `EMAIL_FROM` and `CRON_SECRET`.
- **v3 flow (one loop)**: Face it → Validate → Gap check → Raise → Claim → Studio.
  - **I face this** is the single action on a problem: it counts the person once (a vote) and then offers an optional one-line story (proof). The old separate vote and "This happens to me" buttons are merged (`components/FacePanel.jsx`).
  - **Problems** (`/problems`) has tabs: Most faced · Gaps (no one building) · Newest · Discover, plus search and a country filter. `/gaps` and `/builders` redirect.
  - **Stages** on every card: Open → Validated (10 stories) → Claimed (a builder) → In studio (`problemStage` in `lib/constants.js`).
  - **Duplicate check**: Add a problem shows similar live problems as you type (`/api/problems/similar`).
  - **Follow a problem** by email: people hear when someone claims it or suggests a fix (`lib/follow.js`, needs `RESEND_API_KEY`).
  - **Studio** (`/studio`): how the loop works, biggest gaps, what builders get, and the builders board.
  - One startup form for the directory and for problem pages; the raiser's idea is pinned in the solutions thread; jobs can be tagged to an industry or problem and show on problem pages; sign-in can also switch on the weekly digest; the invite card lives in My Atlas.
- **Admin** (`/admin`): add/pause/delete jobs, hide or delete problems, add or edit unicorns.

## Jobs on problems you care about (v9)

The core of Atlas: **find work on the problems you care about.**

- **I care about this** (♡): on every problem and on `/jobs`. No sign-in needed (visitor cookie); signed-in people keep it across devices. Stored in `cares`; counted on `problems.cares`.
- **Roles come from the startups mapped to problems.** The startup engine stores each problem's matched startups in `problem_matches`. For those startups (and unicorns), `lib/careers.js` looks for a public careers board on **Greenhouse, Lever, Ashby or SmartRecruiters** by trying board names made from the startup's name, and keeps a board only when it checks out (`verifyBoard` in `lib/careers-core.js`: the board names the company *and* its roles are in the company's country). Half-matches go to `/admin` → Careers for review. Recruitee boards and any other careers link can be added by hand.
- **Daily import** (`/api/cron/jobs`, Vercel Cron 01:00 UTC, needs `CRON_SECRET`): re-reads every verified board, closes filled roles, and checks more startups. The jobs and home pages also nudge `/api/jobs/refresh` in the background (does work at most every 10 minutes, one run at a time).
- **Jobs page** (`/jobs`): *For you* (roles at startups working on the problems you care about, with a picker when you have none) and *All roles*; filters for role type, country, remote, area and search; `?problem=ID` and `?company=ID` focus views. Each role shows the problem its startup works on.
- **Problem pages**: "Work on this problem": open roles at the startups solving it, join a builder, or start it yourself.
- **Startups add their own careers page** at `/hiring`. Boards that check out go live at once; others wait for review.
- **Admin** → Careers: approve or reject boards, add a careers link (live at once), run the import now.
- **Weekly email** gains "New roles on problems you care about".
- Hand-picked jobs (the old 50-job board) still work and show under "Hand-picked" on `/jobs`.

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
   | `RESEND_API_KEY` | from [resend.com](https://resend.com) → API Keys (for sign-in links and the digest) |
   | `EMAIL_FROM` | e.g. `Atlas <hello@atlaselevatr.in>` (verify the domain in Resend first) |
   | `CRON_SECRET` | any long random text (protects the weekly digest job) |
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
- Indian startups (`lib/data/india-startups.json`) are built by `scripts/build_india_startups.py` from public Indian startup funding datasets (2015–2021): the Kaggle "Indian Startup Funding" set and the 2018–2021 funding set, via the GitHub repos named in the script. They are imported once on first run. Edit or add startups in `/admin`.
- Global startups (`lib/data/global-startups.json`) are built by `scripts/build_global_startups.py` from the open Y Combinator directory mirror (github.com/yc-oss/api) and Maven Analytics' public-domain unicorn list.
- Data loads run once, in batches, and resume if interrupted. Check `/status` after a deploy.
- Brand name in the footer comes from `NEXT_PUBLIC_PARENT_BRAND` (default "Elevtr Ventures").
