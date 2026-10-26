import { SITE } from '@/lib/constants';

export default function sitemap() {
  return ['', '/problems', '/problems?view=gaps', '/startups', '/studio', '/submit', '/jobs', '/invite', '/about', '/privacy'].map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: 'daily',
  }));
}
