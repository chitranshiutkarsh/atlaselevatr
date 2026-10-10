'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { SITE } from '@/lib/constants';

const LINKS = [
  { href: '/', label: 'Atlas' },
  { href: '/problems', label: 'Leaderboard' },
  { href: '/gaps', label: 'Gaps' },
  { href: '/builders', label: 'Builders' },
  { href: '/startups', label: 'Startups' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/invite', label: 'Invite' },
];

export default function Nav({ signedIn = false }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isOn = (href) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-2xl font-semibold tracking-tight">Atlas</span>
          <span className="label hidden sm:inline">by {SITE.parent}</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isOn(l.href) ? 'bg-ink text-paper' : 'text-ink2 hover:text-ink'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={signedIn ? '/me' : '/signin'}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isOn('/me') || isOn('/signin') ? 'bg-ink text-paper' : 'text-ink2 hover:text-ink'
            }`}
          >
            {signedIn ? 'My Atlas' : 'Sign in'}
          </Link>
          <Link href="/submit" className="btn-primary ml-2">
            + Add a problem
          </Link>
        </div>

        <button
          className="rounded-lg border border-ink/15 px-3 py-2 text-sm lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink/10 bg-paper px-4 pb-4 lg:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block border-b border-ink/5 py-3 text-base ${isOn(l.href) ? 'font-semibold' : 'text-ink2'}`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={signedIn ? '/me' : '/signin'}
            onClick={() => setOpen(false)}
            className={`block border-b border-ink/5 py-3 text-base ${isOn('/me') || isOn('/signin') ? 'font-semibold' : 'text-ink2'}`}
          >
            {signedIn ? 'My Atlas' : 'Sign in'}
          </Link>
          <Link href="/submit" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full">
            + Add a problem
          </Link>
        </div>
      )}
    </header>
  );
}
