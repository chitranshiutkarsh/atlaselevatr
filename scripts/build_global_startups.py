"""Build lib/data/global-startups.json from the public Y Combinator company directory.

Sources:
  1. github.com/yc-oss/api (companies/all.json), an open mirror of
     ycombinator.com/companies. Inactive (shut down) companies are skipped.
  2. Maven Analytics "Unicorn Companies" (public domain; CB Insights list,
     March 2022), via github.com/Adaezethetechie/Unicorn-Analysis.
     Indian unicorns are skipped (lib/data/india-unicorns.js covers them).

Usage: python3 scripts/build_global_startups.py <yc_oss_repo_dir> <unicorn_csv>
"""
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'lib' / 'data' / 'global-startups.json'

# Country names as the map uses them (lib/geo.js).
GEO = (ROOT / 'lib' / 'geo.js').read_text()
_RAW = GEO.split('export const CONTINENTS')[0].replace('"Côte d\'Ivoire"', '')
MAP_COUNTRIES = set(re.findall(r"'([^']+)'", _RAW)) | {"Côte d'Ivoire"}

COUNTRY_FIX = {
    'USA': 'United States of America', 'US': 'United States of America', 'United States': 'United States of America',
    'UK': 'United Kingdom', 'England': 'United Kingdom', 'Scotland': 'United Kingdom', 'Wales': 'United Kingdom',
    'Czech Republic': 'Czechia', 'Türkiye': 'Turkey', 'Republic of Korea': 'South Korea', 'Korea': 'South Korea',
    'Ivory Coast': "Côte d'Ivoire", 'Cote d\'Ivoire': "Côte d'Ivoire", 'UAE': 'United Arab Emirates',
    'Democratic Republic of the Congo': 'Dem. Rep. Congo', 'DRC': 'Dem. Rep. Congo', 'North Macedonia': 'Macedonia',
    'Bosnia and Herzegovina': 'Bosnia and Herz.', 'Dominican Republic': 'Dominican Rep.', 'Eswatini': 'eSwatini',
    'Viet Nam': 'Vietnam', 'Russian Federation': 'Russia', 'Palestinian Territories': 'Palestine',
    'The Bahamas': 'Bahamas', 'Lao PDR': 'Laos', 'Burma': 'Myanmar',
}


def country_of(company):
    locs = company.get('all_locations') or ''
    for loc in locs.split(';'):
        parts = [p.strip() for p in loc.split(',') if p.strip()]
        if not parts or parts[-1].lower() == 'remote':
            continue
        name = COUNTRY_FIX.get(parts[-1], parts[-1])
        if name in MAP_COUNTRIES:
            return name, parts[0] if len(parts) > 1 else None
    for region in company.get('regions') or []:
        name = COUNTRY_FIX.get(region, region)
        if name in MAP_COUNTRIES:
            return name, None
    return None, None


AI_TAGS = {'artificial intelligence', 'generative ai', 'machine learning', 'ai', 'ai assistant', 'deep learning',
           'computer vision', 'nlp', 'conversational ai', 'llm', 'aiops'}


def category(company):
    industry = company.get('industry') or ''
    sub = (company.get('subindustry') or '').lower()
    tags = {t.lower() for t in company.get('tags') or []}
    text = sub + ' ' + ' '.join(tags)
    if industry == 'Fintech':
        return 'Fintech'
    if industry == 'Healthcare':
        return 'Health'
    if industry == 'Education':
        return 'Education'
    if industry == 'Real Estate and Construction':
        return 'Real Estate & Housing'
    if industry == 'Government':
        return 'Government & Civic'
    if re.search(r'climate|energy', text):
        return 'Climate & Energy'
    if re.search(r'agricultur|food and beverage|food', sub):
        return 'Food & Agri'
    if re.search(r'travel|tourism|leisure', sub):
        return 'Travel & Hospitality'
    if re.search(r'gaming', sub):
        return 'Gaming & Entertainment'
    if re.search(r'supply chain|logistics', sub):
        return 'Logistics'
    if re.search(r'transportation|automotive|aviation|drones', sub):
        return 'Mobility'
    if re.search(r'human resources|job and career|recruiting', sub):
        return 'HR & Work'
    if re.search(r'content|social|media|news|virtual and augmented', sub):
        return 'Media & Creators'
    if re.search(r'retail|apparel|home and personal|consumer electronics|marketplace', sub):
        return 'Commerce'
    if tags & AI_TAGS:
        return 'AI & Software'
    if re.search(r'robotics|manufacturing|space', sub):
        return 'AI & Software'
    if industry == 'Consumer':
        return 'Commerce'
    if industry in ('B2B', 'Industrials'):
        return 'SaaS & B2B'
    return 'Other'


def sector(company):
    sub = company.get('subindustry') or ''
    if '->' in sub:
        return sub.split('->')[-1].strip()[:60]
    tags = company.get('tags') or []
    return (tags[0] if tags else sub)[:60] or None


UNICORN_CATEGORY = {
    'fintech': 'Fintech', 'internet software & services': 'SaaS & B2B', 'e-commerce & direct-to-consumer': 'Commerce',
    'health': 'Health', 'artificial intelligence': 'AI & Software', 'supply chain, logistics, & delivery': 'Logistics',
    'cybersecurity': 'SaaS & B2B', 'data management & analytics': 'SaaS & B2B', 'mobile & telecommunications': 'Media & Creators',
    'hardware': 'AI & Software', 'auto & transportation': 'Mobility', 'edtech': 'Education', 'consumer & retail': 'Commerce',
    'travel': 'Travel & Hospitality', 'other': 'Other',
}


def main(yc_dir, unicorn_csv):
    data = json.loads((Path(yc_dir) / 'companies' / 'all.json').read_text())
    seen = set()
    out = []
    skipped = Counter()
    for c in data:
        if c.get('status') == 'Inactive':
            skipped['inactive'] += 1
            continue
        name = (c.get('name') or '').strip()
        if not name or len(name) > 80:
            skipped['name'] += 1
            continue
        key = re.sub(r'[^a-z0-9]', '', name.lower())
        if key in seen:
            skipped['dupe'] += 1
            continue
        country, city = country_of(c)
        if not country:
            skipped['no country'] += 1
            continue
        seen.add(key)
        m = re.search(r'(\d{4})', c.get('batch') or '')
        desc = re.sub(r'\s+', ' ', (c.get('one_liner') or '')).strip()[:300]
        out.append([name, country, city, category(c), sector(c), desc, int(m.group(1)) if m else None, 0])

    # Global unicorns: flag YC ones already listed, add the rest.
    index = {re.sub(r'[^a-z0-9]', '', r[0].lower()): r for r in out}
    added = flagged = 0
    with open(unicorn_csv, encoding='utf-8-sig', errors='replace') as f:
        for u in csv.DictReader(f):
            name = (u.get('Company') or '').strip()
            raw_country = (u.get('Country') or '').strip()
            country = COUNTRY_FIX.get(raw_country, raw_country)
            if not name or country == 'India' or country not in MAP_COUNTRIES:
                continue
            key = re.sub(r'[^a-z0-9]', '', name.lower())
            ind = (u.get('Industry') or '').strip()
            if key in index:
                index[key][7] = 1
                flagged += 1
                continue
            m = re.search(r'(\d{4})', u.get('Date Joined') or '')
            cat = UNICORN_CATEGORY.get(ind.lower(), 'Other')
            row = [name, country, (u.get('City') or '').strip() or None, cat, ind[:60] or None,
                   f'{ind} unicorn' if ind else 'Unicorn startup', int(m.group(1)) if m else None, 1]
            out.append(row)
            index[key] = row
            added += 1
    print('unicorns added:', added, '| YC companies flagged as unicorns:', flagged)

    out.sort(key=lambda r: (r[1], r[0].lower()))
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    print('startups:', len(out), '| skipped:', dict(skipped))
    print('outside India:', sum(1 for r in out if r[1] != 'India'))
    print('countries:', len({r[1] for r in out}))
    print('top countries:', Counter(r[1] for r in out).most_common(15))
    print('categories:', Counter(r[3] for r in out).most_common())
    print('bytes:', OUT.stat().st_size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
