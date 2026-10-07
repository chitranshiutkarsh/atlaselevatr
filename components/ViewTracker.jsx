'use client';

import { useEffect } from 'react';

// Records one real view per problem per day from this browser.
export default function ViewTracker({ id }) {
  useEffect(() => {
    const key = `atlas_view_${id}`;
    try {
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < 24 * 3600 * 1000) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {}
    fetch(`/api/problems/${id}/view`, { method: 'POST', keepalive: true }).catch(() => {});
  }, [id]);
  return null;
}
