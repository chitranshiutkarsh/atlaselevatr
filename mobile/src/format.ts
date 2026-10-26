export function num(n: number | null | undefined) {
  return (n || 0).toLocaleString('en-IN');
}

export function plural(n: number, one: string, many: string) {
  return `${num(n)} ${n === 1 ? one : many}`;
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function label(options: [string, string][], key?: string | null) {
  return options.find(([k]) => k === key)?.[1] || key || '';
}

// "https://www.example.com/path" → "example.com" (no URL class: React Native's is partial).
export function host(url?: string | null) {
  if (!url) return '';
  const m = url.match(/^[a-z]+:\/\/([^/?#]+)/i);
  return (m ? m[1] : url).replace(/^www\./, '');
}
