'use client';

import { useState } from 'react';

const FIELDS = {
  name: ['name', 'startup', 'startup name', 'company', 'company name', 'brand', 'name of the startup', 'name of startup', 'entity name', 'organization name'],
  country: ['country', 'country name'],
  city: ['city', 'location', 'headquarter', 'headquarters', 'hq', 'district'],
  category: ['industry', 'category', 'vertical', 'industry vertical', 'market'],
  sector: ['sector', 'sub sector', 'sub-sector', 'subvertical', 'sub vertical', 'sub-vertical'],
  description: ['description', 'what it does', 'about', 'about company', 'one liner', 'tagline', 'problem', 'short description'],
  website: ['website', 'url', 'homepage', 'homepage url', 'web'],
  year: ['founded', 'year', 'founded year', 'year founded', 'founding year', 'year of incorporation'],
};
const BATCH = 500;

// Small CSV parser that handles quoted fields, commas and newlines inside quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

function mapHeaders(header) {
  const norm = header.map((h) => h.replace(/^﻿/, '').trim().toLowerCase().replace(/[_]+/g, ' '));
  const map = {};
  for (const [field, aliases] of Object.entries(FIELDS)) {
    const idx = norm.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[field] = idx;
  }
  return map;
}

// Admin tool: upload a CSV of startups (e.g. the DPIIT list) and add them in batches.
export default function CsvImport({ onDone }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [update, setUpdate] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  async function pick(e) {
    setError('');
    setProgress(null);
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const rows = parseCsv(text);
    if (rows.length < 2) return setError('That file has no data rows.');
    const map = mapHeaders(rows[0]);
    if (map.name === undefined) return setError(`Couldn't find a name column. Headers found: ${rows[0].slice(0, 8).join(', ')}`);
    const records = rows.slice(1).map((r) => {
      const o = {};
      for (const [field, idx] of Object.entries(map)) o[field] = r[idx];
      return o;
    });
    setFile(f.name);
    setPreview({ map, header: rows[0], records });
  }

  async function run() {
    const total = { inserted: 0, updated: 0, skipped: 0, invalid: 0 };
    const recs = preview.records;
    setProgress({ done: 0, total: recs.length, ...total });
    try {
      for (let i = 0; i < recs.length; i += BATCH) {
        const res = await fetch('/api/admin/companies/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: recs.slice(i, i + BATCH), update }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');
        for (const k of Object.keys(total)) total[k] += data[k] || 0;
        setProgress({ done: Math.min(i + BATCH, recs.length), total: recs.length, ...total });
      }
      onDone?.(`Imported ${total.inserted.toLocaleString('en-IN')} new startups`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card space-y-3 p-5">
      <p className="font-semibold">Bulk import from CSV</p>
      <p className="text-xs text-ink2">
        Needs a name column. Also reads country (default India), city, industry/category, sector, description,
        website and founded year when present. Existing names are skipped unless you tick update.
      </p>
      <input type="file" accept=".csv,text/csv" onChange={pick} className="block w-full text-sm" />
      {preview && (
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">{file}</span>: {preview.records.length.toLocaleString('en-IN')} rows
          </p>
          <p className="font-mono text-xs text-ink2">
            {Object.entries(preview.map).map(([f, i]) => `${f} ← "${preview.header[i]}"`).join(' · ')}
          </p>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={update} onChange={(e) => setUpdate(e.target.checked)} />
            Also update city/sector/website of startups already listed
          </label>
          <button className="btn-primary w-full" onClick={run} disabled={progress && progress.done < progress.total}>
            {progress && progress.done < progress.total ? `Importing… ${progress.done}/${progress.total}` : 'Import'}
          </button>
        </div>
      )}
      {progress && (
        <p className="font-mono text-xs">
          {progress.done}/{progress.total} processed · {progress.inserted} added · {progress.updated} updated ·{' '}
          {progress.skipped} already listed · {progress.invalid} invalid
        </p>
      )}
      {error && <p className="text-sm text-signal">{error}</p>}
    </div>
  );
}
