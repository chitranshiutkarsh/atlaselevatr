import Link from 'next/link';
import StartupDirectory from '@/components/StartupDirectory';
import { INDUSTRIES } from '@/lib/constants';
import { CONTINENT_OF, CONTINENTS, prettyName } from '@/lib/geo';

export const metadata = {
  title: 'Startup directory',
  description: 'Thousands of startups organised by category and city, with the problem each one is solving.',
};

export default function StartupsPage({ searchParams }) {
  const country = CONTINENT_OF[searchParams.country] ? searchParams.country : searchParams.continent ? null : 'India';
  const continent = !country && CONTINENTS.some((c) => c.name === searchParams.continent) ? searchParams.continent : null;
  const initial = {
    industry: INDUSTRIES.includes(searchParams.industry) ? searchParams.industry : null,
    city: typeof searchParams.city === 'string' ? searchParams.city.slice(0, 60) : null,
    q: typeof searchParams.q === 'string' ? searchParams.q.slice(0, 80) : '',
    unicorn: searchParams.unicorn === '1',
  };
  const scopeLabel = country ? prettyName(country) : continent || 'the world';
  const tabs = [
    { label: 'India', href: '/startups?country=India', on: country === 'India' },
    ...CONTINENTS.map((c) => ({
      label: c.name,
      href: `/startups?continent=${encodeURIComponent(c.name)}`,
      on: continent === c.name,
    })),
  ];

  return (
    <div className="pt-12">
      <p className="label">Directory</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Startups in {scopeLabel}
      </h1>
      <p className="mt-3 max-w-2xl text-ink2">
        Every startup, sorted into categories, with what it does and where it&apos;s based. Unicorns are listed first.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link key={t.label} href={t.href} className={t.on ? 'chip-on' : 'chip'}>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card mt-6 p-4 sm:p-6">
        <StartupDirectory key={`${country}|${continent}`} country={country} continent={continent} initial={initial} syncUrl />
      </div>

      <p className="mt-4 text-xs text-ink2">
        Indian startups are compiled from public startup funding records (2015–2021). Spot something wrong or missing?
        Tell us and we&apos;ll fix it.
      </p>
    </div>
  );
}
