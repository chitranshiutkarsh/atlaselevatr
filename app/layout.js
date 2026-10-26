import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { SITE } from '@/lib/constants';
import { getUserId } from '@/lib/auth';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — work on the problems you care about | ${SITE.parent}`,
    template: `%s · ${SITE.name}`,
  },
  description: `${SITE.tagline} Atlas maps the problems people face and the startups solving them, with the open roles at each. Pick the problems that matter to you and apply. An ${SITE.parent} initiative.`,
  openGraph: {
    title: `${SITE.name} by ${SITE.parent}`,
    description: SITE.tagline,
    url: SITE.url,
    siteName: SITE.name,
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: `${SITE.name} by ${SITE.parent}`, description: SITE.tagline },
};

export const viewport = { themeColor: '#F4F1EA' };

// Every page reads live data; never serve cached database responses.
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="graticule min-h-screen">
        <Nav signedIn={Boolean(getUserId())} />
        <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
