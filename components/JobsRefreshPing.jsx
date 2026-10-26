'use client';

import { useEffect } from 'react';

// Nudges the jobs import in the background (at most once per browser session).
// The server ignores it unless a refresh is due, so this never slows the page.
export default function JobsRefreshPing() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('atlas-jobs-ping')) return;
      sessionStorage.setItem('atlas-jobs-ping', '1');
    } catch {
      // storage unavailable: ping anyway, the server rate-limits
    }
    fetch('/api/jobs/refresh', { method: 'POST', keepalive: true }).catch(() => {});
  }, []);
  return null;
}
