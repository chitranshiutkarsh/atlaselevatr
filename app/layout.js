import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { SITE } from '@/lib/constants';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — the world's problems, mapped | ${SITE.parent}`,
    template: `%s · ${SITE.name}`,
  },
  description: `${SITE.tagline} Explore what unicorns solved on every continent, add the problems you see, vote on what matters, and find problem-solving jobs. An ${SITE.parent} initiative.`,
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="graticule min-h-screen">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
