# Atlas for iPhone and Android

The Atlas phone app, built with Expo (React Native). It talks to the live site at `https://atlaselevatr.in`, so problems, votes, stories and builders are the same everywhere.

## What's in the app

| Tab / screen | What it does |
|---|---|
| **Problems** | Most faced · Gaps · Newest · Discover, with search and country / industry filters. "I face this" right on each card. |
| **Problem page** | Stage (Open → Validated → Claimed → In studio), **I face this** + one-line story, the evidence (how often, would pay, who it hits), gap check and the startups already solving it, builders, ideas and comments (mark helpful), jobs, follow by email, share. |
| **Add a problem** | No sign-up. Shows similar problems as you type, then opens the new problem with a "Live now" banner. |
| **Atlas** | World map shaded by problems or startups. Pick a continent, tap a country, see its top problems and unicorns. |
| **Startups** | All ~9,700 startups, unicorn filter, country, industry, search. Tap to open their website. |
| **Jobs** | The curated jobs board; Apply opens the original posting. |
| **My Atlas** | Your invite code and link (with visits / joined / problems), problems you raised and face, what you're building, invite code entry, builders board, links. |
| **Want to build this? / Ask for an intro** | Builder leads and intro requests land in `/admin` like on the website. |
| **Report** | Flag icon on every problem, story, comment and builder card. It hides the item for that person at once and sends it to `/admin → Reports`. |

No accounts: each phone gets a random device id (kept on the phone, sent with each request) so one vote per person still holds. The sign-in, weekly digest and "list your startup" flows stay on the website for now.

---

## 1. Ship the backend first

The app needs the new endpoints under `/api/app/...` in this repo. Merge the branch into `main`; Vercel deploys it. Then check:

- `https://atlaselevatr.in/api/app/meta` shows JSON
- `https://atlaselevatr.in/privacy` shows the privacy page (the stores require it)
- In Vercel → Settings → Environment Variables, add `CONTACT_EMAIL` = an inbox you read (e.g. `hello@atlaselevatr.in`). The privacy page and the app show it. Redeploy.

The first request after deploying updates the database (adds the `reports` table) automatically.

## 2. Try it on your phone (about 15 minutes)

You need a Mac or PC with **Node.js 22** or newer (nodejs.org) and a free **Expo account** (expo.dev/signup).

```bash
git clone https://github.com/chitranshiutkarsh/atlaselevatr
cd atlaselevatr/mobile
npm install
npx expo login          # same Expo account you'll use on the phone
npx expo start
```

On your phone, install **Expo Go** (App Store / Play Store), sign in with the same Expo account (avatar, top right on the Home tab), then scan the QR code from the terminal. The app opens with live data.

The project is on **Expo SDK 57**, the newest version Expo Go supports today. If `npx expo-doctor` reports problems after an Expo update, run `npx expo install --fix`.

## 3. Accounts you need for the stores

| | Apple App Store | Google Play |
|---|---|---|
| Cost | US$99 a year | US$25 once |
| Sign up | developer.apple.com/programs/enroll | play.google.com/console/signup |
| As a company (your company name shows as the seller) | Needs a **D-U-N-S number** for the company, a company-domain email and a working company website. Takes a few days. | Choose an **Organization** account. |
| As an individual | Faster, shows your name. | New **personal** accounts must run a closed test with **12+ testers for 14 days** before going public. |

Publishing as your company looks more credible and, on Google Play, the 12-tester rule above applies only to personal accounts. Start the D-U-N-S request early: Apple says it can take up to 5 business days.

## 4. Build the store versions

Expo's servers build and sign the apps; you don't need Xcode or Android Studio. The free Expo plan includes 15 iOS and 15 Android builds a month.

```bash
npm install -g eas-cli
eas login
eas init                       # links this folder to an Expo project (one time)
npm run build:store            # builds iOS + Android (about 20–40 min, you get links)
```

The first time, EAS asks to create the iOS certificates and the Android keystore. Say yes; it stores them safely for you.

Want a test version for friends first? `npm run build:preview` makes an Android APK you can send as a link (iPhones need TestFlight, below).

## 5. Submit

**iPhone**

1. In App Store Connect → Apps → **+** → New App: name **Atlas** (if taken, "Atlas by Elevatr"), bundle id `in.atlaselevatr.app`, SKU `atlas-ios`.
2. `npm run submit:ios` uploads the latest build. It shows up in **TestFlight** in about 15 minutes: test it on your own phone first.
3. Fill in the listing (below), attach the build, and **Submit for Review**. Reviews often take a day or two.

**Android**

1. In Play Console → **Create app**: name Atlas, app, free.
2. Google requires the **first** upload by hand: download the `.aab` from the EAS build page and upload it under Testing → Internal testing → Create release. After that, `npm run submit:android` uploads new builds for you.
3. Fill in the store listing, Data safety, content rating and target audience, then promote the release to Production (personal accounts: closed testing first, see above).

## 6. Store listing: copy you can paste

- **Name:** Atlas · **Subtitle (iOS, 30 chars):** Problems worth solving
- **Category:** Business (secondary: Social Networking)
- **Short description (Play, 80 chars):** Every unsolved problem on Earth, mapped and ranked. Say which ones you face.
- **Description:**

  > Atlas maps the problems people face, country by country, and ranks them by how many people face them.
  >
  > • Say "I face this" and add a one-line story: ten stories validate a problem for founders.
  > • See who is already solving it: 9,700+ startups and every unicorn, checked against each problem.
  > • Find the gaps: problems lots of people have and no local startup works on.
  > • Want to build one? Raise your hand and get support from the Elevatr Ventures studio.
  > • Add a problem in seconds. No sign-up.
  > • Problem-solving jobs, hand-picked.
  >
  > An Elevatr Ventures initiative.

- **Keywords (iOS):** problems,startups,founders,ideas,unicorns,venture,validate,gaps,jobs,india
- **Privacy policy URL:** https://atlaselevatr.in/privacy · **Support URL:** https://atlaselevatr.in/about

**App privacy (Apple) / Data safety (Google):** no tracking, no ads, no third-party analytics. Declare:
- *User content* (problems, stories, comments): collected, app functionality, not linked to identity.
- *Contact info* (name, email, phone: only if someone fills in "Want to build this?", "Ask for an intro" or "Follow"): collected, app functionality, linked to the person.
- *Identifiers* (device id): collected, app functionality, not used for tracking.
- Data is encrypted in transit; people can ask for deletion at the contact email.

**Age rating:** answer "yes" to user-generated content. **Review notes for Apple:** "No login required. All content is public. Every post has a flag icon to report it; reported items are hidden for the reporter immediately and reviewed by our team in our admin panel; items reported by several people are hidden for everyone."

**Screenshots:** iPhone 6.9" (1320 × 2868) and Android phone. Take them from the TestFlight / internal-test build: Problems, a problem page, the Atlas map, Startups, My Atlas. `assets/store-feature-graphic.png` is the 1024 × 500 Play feature graphic.

## 7. Updating the app later

- Data, problems, jobs, industries and countries update live; no app release needed.
- For a new app version: change `"version"` in `app.json` (e.g. `1.0.1`), then `npm run build:store` and the submit commands. Build numbers go up automatically.

## Moderation

`/admin → 🚩 Reports` lists everything reported from the app with the reported text. **Hide** removes it from Atlas; **Keep** closes the report and shows it again. Items reported by 3 different people (5 for problems) are hidden automatically until you decide.

## For developers

- `src/api.ts` is the only place that talks to the server. Point the app at a local backend with `EXPO_PUBLIC_API_URL=http://<your-computer-ip>:3000 npx expo start`.
- `src/data/meta.json` is a bundled copy of `/api/app/meta` (industries, countries, form options); the app refreshes it from the server.
- The map outlines come from `/api/app/world` (world-atlas 110m, the same file the website uses) and are cached on the phone.
- `npm run typecheck` · `npm run doctor`
