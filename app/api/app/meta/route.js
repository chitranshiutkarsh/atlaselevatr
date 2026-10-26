import {
  SITE,
  INDUSTRIES,
  LIMITS,
  VALIDATION,
  STAGES,
  BUILDER_STAGES,
  BUILDER_COMMITMENT,
  BUILDER_NEEDS,
  PROOF_FREQUENCY,
  PROOF_PAY,
  PROOF_WHO,
  REPORT_REASONS,
} from '@/lib/constants';
import { COUNTRIES, CONTINENTS, CONTINENT_OF, prettyName } from '@/lib/geo';

// Lists and limits the phone app needs. The app ships with a copy and
// refreshes it from here, so edits to lib/constants.js reach it without a release.
export async function GET() {
  return Response.json(
    {
      version: 1,
      site: { name: SITE.name, url: SITE.url, parent: SITE.parent, tagline: SITE.tagline },
      industries: INDUSTRIES,
      countries: COUNTRIES.map((name) => ({ name, label: prettyName(name), continent: CONTINENT_OF[name] })),
      continents: CONTINENTS.map(({ name, slug }) => ({ name, slug })),
      limits: LIMITS,
      validation: VALIDATION,
      stages: STAGES,
      builder: { stages: BUILDER_STAGES, commitment: BUILDER_COMMITMENT, needs: BUILDER_NEEDS },
      proof: { frequency: PROOF_FREQUENCY, pay: PROOF_PAY, who: PROOF_WHO },
      reportReasons: REPORT_REASONS,
      // Shown in the app's Me tab and needed for the store listings.
      links: {
        privacy: `${SITE.url}/privacy`,
        about: `${SITE.url}/about`,
        studio: `${SITE.url}/studio`,
        contact: process.env.CONTACT_EMAIL || `hello@${SITE.domain}`,
      },
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  );
}
