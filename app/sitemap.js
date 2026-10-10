import { SITE } from '@/lib/constants';

export default function sitemap() {
  return ['', '/startups', '/problems', '/gaps', '/builders', '/submit', '/jobs', '/invite', '/about'].map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: 'daily',
  }));
}
