import { SITE } from '@/lib/constants';

export default function sitemap() {
  return ['', '/problems', '/submit', '/jobs', '/invite'].map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: 'daily',
  }));
}
