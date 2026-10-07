function text(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function cleanJob(body, sources) {
  const title = text(body.title, 120);
  const company = text(body.company, 120);
  const location = text(body.location, 80) || null;
  const focus = text(body.focus, 160) || null;
  const source = sources.includes(body.source) ? body.source : 'Other';
  let url = text(body.url, 600);
  if (title.length < 2) return { error: 'Job title is required.' };
  if (company.length < 2) return { error: 'Company is required.' };
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad');
    url = parsed.toString();
  } catch {
    return { error: 'Paste the full apply link, starting with https://' };
  }
  return { title, company, location, focus, source, url };
}
