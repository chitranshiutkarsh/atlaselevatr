"""Build lib/data/india-startups.json from public Indian startup funding datasets.

Sources (public, community-maintained funding records):
  1. "Indian Startup Funding" 2015-2020 (Kaggle, sudalairajkumar), via
     github.com/blaine12100/Indian-Startup-Funding-Analysis/startup_funding_unmodified.csv
  2. Indian startup funding 2018-2021, via
     github.com/aaronayitey/Indian-Startup-Funding-Analysis
     (data/complete_dataset.xlsx, data/startup_funding2018.csv, data/startup_funding2019.csv)

Usage: python3 scripts/build_india_startups.py <blaine_repo_dir> <aaron_repo_dir>
Needs: openpyxl
"""
import csv
import json
import re
import sys
from pathlib import Path

import openpyxl

OUT = Path(__file__).resolve().parent.parent / 'lib' / 'data' / 'india-startups.json'

# ---------- cleaning helpers ----------

ESCAPES = {
    '\\xe2\\x80\\x99': '’', '\\xe2\\x80\\x98': '‘', '\\xe2\\x80\\x93': '-',
    '\\xe2\\x80\\x94': '-', '\\xc2\\xa0': ' ', '\\xe2\\x80\\x9c': '"', '\\xe2\\x80\\x9d': '"',
    'xe2x80x99': "'", 'xe2x80x98': "'", 'xe2x80x93': '-', 'xc2xa0': ' ',
}


def clean(s):
    if s is None:
        return ''
    s = str(s)
    for k, v in ESCAPES.items():
        s = s.replace(k, v)
    s = re.sub(r'\\x[0-9a-fA-F]{2}', '', s)
    s = s.replace('\\n', ' ').replace('\\', '')
    s = re.sub(r'\s+', ' ', s).strip()
    if s.lower() in ('nan', 'none', 'null', 'n/a', '-'):
        return ''
    s = re.sub(r'\s+', ' ', s).strip().strip('"').strip()
    return s


def norm_key(name):
    n = name.lower().replace('&', 'and')
    n = re.sub(r'\b(pvt|private|ltd|limited|llp|inc|co)\b\.?', ' ', n)
    n = re.sub(r'\.(com|in|co|ai|io)\b', ' ', n)
    n = re.sub(r'[^a-z0-9]', '', n)
    return n


BAD_NAMES = {'', 'undisclosed', 'unknown', 'na', 'n/a', 'nan', 'none', '-', 'others', 'other'}

CITY_ALIASES = {
    'bangalore': 'Bengaluru', 'bengaluru': 'Bengaluru', 'banglore': 'Bengaluru', 'bangaore': 'Bengaluru',
    'gurgaon': 'Gurugram', 'gurugram': 'Gurugram', 'gurgoan': 'Gurugram',
    'new delhi': 'Delhi', 'delhi': 'Delhi', 'delhi ncr': 'Delhi NCR', 'ncr': 'Delhi NCR',
    'mumbai': 'Mumbai', 'bombay': 'Mumbai', 'navi mumbai': 'Navi Mumbai', 'thane': 'Thane',
    'noida': 'Noida', 'greater noida': 'Noida', 'hyderabad': 'Hyderabad', 'secunderabad': 'Hyderabad',
    'chennai': 'Chennai', 'pune': 'Pune', 'kolkata': 'Kolkata', 'calcutta': 'Kolkata',
    'ahmedabad': 'Ahmedabad', 'ahemadabad': 'Ahmedabad', 'ahemdabad': 'Ahmedabad', 'ahmadabad': 'Ahmedabad', 'jaipur': 'Jaipur',
    'chandigarh': 'Chandigarh', 'kochi': 'Kochi', 'cochin': 'Kochi', 'indore': 'Indore',
    'coimbatore': 'Coimbatore', 'bhopal': 'Bhopal', 'lucknow': 'Lucknow', 'goa': 'Goa',
    'trivandrum': 'Thiruvananthapuram', 'thiruvananthapuram': 'Thiruvananthapuram',
    'vadodara': 'Vadodara', 'surat': 'Surat', 'nagpur': 'Nagpur', 'mohali': 'Mohali', 'kanpur': 'Kanpur',
    'bhubaneswar': 'Bhubaneswar', 'patna': 'Patna', 'udaipur': 'Udaipur', 'faridabad': 'Faridabad',
    'mysore': 'Mysuru', 'mysuru': 'Mysuru', 'visakhapatnam': 'Visakhapatnam', 'vizag': 'Visakhapatnam',
    'gwalior': 'Gwalior', 'dehradun': 'Dehradun', 'ranchi': 'Ranchi', 'guwahati': 'Guwahati',
    'kozhikode': 'Kozhikode', 'calicut': 'Kozhikode', 'nashik': 'Nashik', 'rajkot': 'Rajkot',
    'gandhinagar': 'Gandhinagar', 'varanasi': 'Varanasi', 'ludhiana': 'Ludhiana', 'amritsar': 'Amritsar',
    'jodhpur': 'Jodhpur', 'kota': 'Kota', 'siliguri': 'Siliguri', 'belgaum': 'Belagavi', 'hubli': 'Hubballi',
    'madurai': 'Madurai', 'tirupur': 'Tiruppur', 'manipal': 'Manipal', 'kerala': 'Kerala', 'india': '', 'nan': '', 'undisclosed': '', 'unknown': '', 'na': '', 'none': '', 'not available': '',
}

FOREIGN = {
    'us', 'usa', 'united states', 'singapore', 'london', 'new york', 'san francisco', 'california',
    'palo alto', 'menlo park', 'boston', 'seattle', 'dubai', 'santa monica', 'bay area', 'beijing',
    'shanghai', 'berlin', 'paris', 'hong kong', 'sf', 'san jose', 'mountain view', 'new jersey',
    'missourie', 'missouri', 'texas', 'austin', 'chicago', 'delaware', 'burlingame', 'cupertino',
    'sunnyvale', 'tulangan', 'uk', 'united kingdom', 'abu dhabi', 'riyadh', 'tokyo', 'sydney',
    'toronto', 'jakarta', 'kuala lumpur', 'bangkok', 'nairobi', 'lagos', 'cairo', 'tel aviv',
    'amsterdam', 'stockholm', 'helsinki', 'zurich', 'geneva', 'irvine', 'newcastle', 'los angeles',
    'washington', 'atlanta', 'dallas', 'houston', 'denver', 'miami', 'philadelphia', 'pittsburgh',
    'frisco', 'san mateo', 'redwood city', 'santa clara', 'oakland', 'princeton', 'cambridge',
    'wilmington', 'outside india', 'global', 'online', 'worldwide',
}


def city_of(raw):
    c = clean(raw)
    if not c:
        return '', False
    first = re.split(r'[,/]| and ', c)[0].strip().lower()
    full = c.lower()
    if first in FOREIGN or full in FOREIGN:
        return '', True
    if first in CITY_ALIASES:
        return CITY_ALIASES[first], False
    if 'bangalore' in full or 'bengaluru' in full:
        return 'Bengaluru', False
    if 'gurgaon' in full or 'gurugram' in full:
        return 'Gurugram', False
    if 'delhi' in full:
        return 'Delhi', False
    if 'mumbai' in full:
        return 'Mumbai', False
    for word in FOREIGN:
        if re.search(r'\b' + re.escape(word) + r'\b', full):
            return '', True
    return first.title()[:40], False


# ---------- categorisation ----------
# First matching rule wins. Matched against the sector text, then the description.
RULES = [
    ('Education', r'ed\w*tech|ed-tech|education|e-learning|elearning|(?<!machine )(?<!deep )learning|school|tutor|coaching|\bexam|course|skill|university|student|teacher|upskill|k12|test prep'),
    ('Health', r'health|medic|hospital|pharma|doctor|diagnos|wellness|fitness|clinic|biotech|medtech|patient|dental|nursing|mental|ayurved|life ?science|telemedicine|care home|eldercare|yoga'),
    ('Fintech', r'fintech|fin-tech|financ|payment|lending|loan|credit|insur|bank|wallet|invest|wealth|crypto|bitcoin|mutual fund|\bstocks?\b|trading|accounting|\btax\b|neobank|remittance|nbfc|microfinance|\bpos\b|\bupi\b'),
    ('Food & Agri', r'food|agri|agtech|farm|dairy|restaurant|beverage|\btea\b|coffee|kitchen|meal|grocery|snack|bakery|organic|fishery|poultry|meat|nutrition|chef|cafe|brew|liquor|beer|wine|recipe'),
    ('Travel & Hospitality', r'travel|hotel|hospitality|\btour|holiday|\btrip|\bstays?\b|booking|ticket|airline|vacation|homestay|hostel'),
    ('Gaming & Entertainment', r'gaming|\bgames?\b|esport|fantasy|entertainment|movie|\bfilm|music|\bevents?\b|cinema|comic|animation|\bsports?\b'),
    ('Media & Creators', r'media|content|news|publish|video|creator|influencer|social|community|podcast|streaming|advertis|marketing|brand|digital media|vernacular|dating|matrimon|spiritual|devotional|astrolog|messaging|chat|blog'),
    ('Real Estate & Housing', r'real ?estate|property|housing|home rental|house rental|interior|construction|coliving|co-living|coworking|co-working|furniture|architect|proptech|home decor|home services'),
    ('HR & Work', r'\bhr\b|hrtech|recruit|hiring|\bjobs?\b|talent|staffing|payroll|workforce|employee|freelanc|\bgig|career|human resource|manpower'),
    ('Logistics', r'logistic|delivery|courier|shipping|supply chain|freight|warehous|last mile|last-mile|trucking|fleet|parcel|hyperlocal'),
    ('Mobility', r'mobility|transport|\bcabs?\b|taxi|\bride|\bbikes?\b|scooter|automotive|automobile|vehicle|\bcar\b|\bcars\b|\bauto\b|parking|\bbus\b|\bev\b|electric vehicle|two-wheeler'),
    ('Climate & Energy', r'energy|solar|clean ?tech|renewable|climate|waste|recycl|sustainab|water|environment|carbon|battery|green'),
    ('SaaS & B2B', r'saas|b2b|enterprise|crm|erp|software|cloud|it services|it solution|analytics|\bdata\b|platform for business|\bsmes?\b|msme|procurement|marketplace for business|\bapi\b|developer|cyber|security|devops|\biot\b|consult|engineering|automation|packaging|telecom|sales and distribution|business development|customer engagement|growth hack|it startup|paas|wholesale|hardware|semiconductor|manufactur|industrial'),
    ('AI & Software', r'\bai\b|artificial intelligence|machine learning|deep learning|\bml\b|deep ?tech|robot|drone|computer vision|\bnlp\b|blockchain|space ?tech|satellite|search engine|\bar\b|\bvr\b|augmented|virtual reality|technology|\btech\b|\bapps?\b|mobile app'),
    ('Commerce', r'commerce|retail|shop|store|fashion|apparel|cloth|beauty|cosmetic|personal care|jewel|footwear|d2c|direct-to-consumer|consumer|marketplace|e-tail|grooming|lifestyle|baby|kids|\bpets?\b|gift|eyewear|electronics|appliance|luxury|fmcg|subscription|coupon|loyalty|reward|cashback|e ?tailor|warranty|laundry'),
]
GENERIC = re.compile(r'^(consumer internet|technology|tech|internet|others?|e-?commerce|ecommerce|services|startup|na|nan|)$')


def categorise(sector, desc):
    s = sector.lower()
    d = desc.lower()
    if s and not GENERIC.match(s):
        for name, pat in RULES:
            if re.search(pat, s):
                return name
    for name, pat in RULES:
        if re.search(pat, d):
            return name
    if s:
        for name, pat in RULES:
            if re.search(pat, s):
                return name
    return 'Other'


def tidy_sector(raw):
    s = clean(raw)
    s = re.split(r',', s)[0].strip()
    fixes = {'ecommerce': 'E-commerce', 'e-commerce': 'E-commerce', 'fintech': 'FinTech', 'edtech': 'EdTech',
             'healthtech': 'HealthTech', 'agritech': 'AgriTech', 'foodtech': 'FoodTech'}
    return fixes.get(s.lower(), s)[:60]


# Companies widely reported as having reached a $1B+ valuation.
# Canonical name -> other names the same company appears under in the data.
UNICORN_GROUPS = {
    'Flipkart': [], 'Paytm': ['One97 Communications'], 'Ola': ['Olacabs', 'Ola Cabs', 'ANI Technologies'],
    'OYO': ['OYO Rooms', 'OyoRooms', 'Oravel Stays'], 'Swiggy': ['Bundl Technologies'], 'Zomato': [],
    "BYJU'S": ['Byjus', 'Think and Learn'], 'Unacademy': [], 'Dream11': ['Dream Sports'], 'PhonePe': [],
    'Freshworks': ['Freshdesk'], 'Zerodha': [], 'Razorpay': [], 'CRED': [], 'Meesho': [], 'Groww': [],
    'Udaan': [], 'Lenskart': ['Lenskart.com'], 'Delhivery': [], 'Nykaa': [], 'Policybazaar': ['PolicyBazaar.com'],
    'Pine Labs': [], 'BharatPe': [], 'Vedantu': ['Vedantu Innovations'], 'upGrad': [],
    'Eruditus': ['ERUDITUS Executive Education'], 'PhysicsWallah': ['Physics Wallah'],
    'ShareChat': ['Mohalla Tech'], 'DailyHunt': ['VerSe Innovation'], 'InMobi': [], 'Glance': [],
    'Rapido': ['Rapido Bike Taxi'], 'Zepto': [], 'CARS24': [], 'Spinny': [], 'CarDekho': ['Girnar Software'],
    'Infra.Market': [], 'OfBusiness': [], 'Zetwerk': [], 'Moglix': [], 'Mamaearth': ['Honasa Consumer'],
    'FirstCry': ['BrainBees Solutions'], 'Urban Company': ['UrbanClap'], 'Slice': [], 'Acko': [],
    'Digit Insurance': ['Go Digit'], 'Chargebee': [], 'Postman': [], 'BrowserStack': [], 'Innovaccer': [],
    'Darwinbox': [], 'Uniphore': [], 'Gupshup': [], 'MindTickle': [], 'LEAD School': [],
    'PharmEasy': ['API Holdings'], 'Pristyn Care': [], 'Licious': [], 'Rebel Foods': [],
    'Mobile Premier League': ['MPL'], 'Games24x7': [], 'Apna': ['Apna.co'], 'Livspace': [],
    'NoBroker': ['NoBroker.com'], 'Polygon': [], 'CoinDCX': [], 'CoinSwitch': ['CoinSwitch Kuber'],
    'Ola Electric': [], 'BigBasket': [], 'Hike': [], 'Quikr': [], 'Snapdeal': [], 'ShopClues': [],
    'BillDesk': [], 'Druva': [], 'Icertis': [], 'Purplle': [], 'Mensa Brands': [], 'Yubi': ['CredAvenue'],
    'OneCard': [], 'Open': [], 'Xpressbees': [], 'Shiprocket': [], 'Hasura': [], 'Perfios': [], 'InCred': [],
    'Porter': [], 'ElasticRun': [], 'DealShare': [], 'Amagi': [], 'Turing': [], 'Mu Sigma': [],
}
CANONICAL = {}
ALIASES = {}
for _canon, _others in UNICORN_GROUPS.items():
    _ck = norm_key(_canon)
    CANONICAL[_ck] = _canon
    for _o in _others:
        ALIASES[norm_key(_o)] = _ck
UNICORN_KEYS = set(CANONICAL)



def main(blaine_dir, aaron_dir):
    blaine = Path(blaine_dir)
    aaron = Path(aaron_dir)
    records = {}  # key -> dict
    foreign_dropped = 0

    def add(name, city_raw, sector_raw, desc, year):
        nonlocal foreign_dropped
        name = clean(name)
        name = re.sub(r'^https?://(www\.)?', '', name).strip('/')
        if name.lower() in BAD_NAMES or len(name) < 2 or len(name) > 60:
            return
        city, foreign = city_of(city_raw)
        if foreign:
            foreign_dropped += 1
            return
        key = norm_key(name)
        if not key:
            return
        if key in ALIASES:
            key = ALIASES[key]
            name = CANONICAL[key]
        elif key in CANONICAL:
            name = CANONICAL[key]
        desc = clean(desc)
        sector = tidy_sector(sector_raw)
        if re.search(r'venture capital|private equity|angel network|incubator|accelerator', sector.lower()):
            return
        if desc.lower() == sector.lower() or len(desc) < 12:
            desc = ''
        r = records.get(key)
        if not r:
            r = records[key] = {'n': name, 'c': city, 's': sector, 'd': desc, 'y': year}
        else:
            if year and (not r['y'] or year > r['y']):
                r['y'] = year
                r['n'] = name if len(name) <= len(r['n']) + 4 else r['n']
            if not r['c'] and city:
                r['c'] = city
            if not r['s'] and sector:
                r['s'] = sector
            if desc and (not r['d'] or len(desc) > len(r['d'])):
                r['d'] = desc

    # 1. SRK 2015-2020
    with open(blaine / 'startup_funding_unmodified.csv', encoding='utf-8', errors='replace') as f:
        rows = list(csv.reader(f))
    for r in rows[1:]:
        if len(r) < 6:
            continue
        m = re.search(r'(20\d\d)', r[1] or '')
        add(r[2], r[5], r[3], r[4], int(m.group(1)) if m else None)

    # 2a. 2018 with descriptions
    with open(aaron / 'data' / 'startup_funding2018.csv', encoding='utf-8-sig', errors='replace') as f:
        for r in csv.DictReader(f):
            add(r.get('Company Name'), r.get('Location'), r.get('Industry'), r.get('About Company'), 2018)

    # 2b. 2019 with descriptions
    with open(aaron / 'data' / 'startup_funding2019.csv', encoding='utf-8-sig', errors='replace') as f:
        for r in csv.DictReader(f):
            add(r.get('Company/Brand'), r.get('HeadQuarter'), r.get('Sector'), r.get('What it does'), 2019)

    # 2c. 2018-2021 combined
    wb = openpyxl.load_workbook(aaron / 'data' / 'complete_dataset.xlsx', read_only=True)
    it = wb.active.iter_rows(values_only=True)
    header = next(it)
    idx = {h: i for i, h in enumerate(header)}
    for r in it:
        year = r[idx['Year Funded']]
        try:
            year = int(year)
        except (TypeError, ValueError):
            year = None
        add(r[idx['Company Name']], r[idx['HeadQuarter']], r[idx['Sector']], '', year)

    out = []
    for key, r in records.items():
        r['i'] = categorise(r['s'], r['d'])
        r['u'] = key in UNICORN_KEYS
        out.append(r)
    out.sort(key=lambda r: (not r['u'], r['n'].lower()))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    compact = [[r['n'], r['c'], r['i'], r['s'], r['d'], r['y'], 1 if r['u'] else 0] for r in out]
    OUT.write_text(json.dumps(compact, ensure_ascii=False, separators=(',', ':')))

    from collections import Counter
    print('startups:', len(out), '| foreign rows dropped:', foreign_dropped)
    print('unicorns flagged:', sum(r['u'] for r in out))
    print('with description:', sum(1 for r in out if r['d']))
    print('categories:', Counter(r['i'] for r in out).most_common())
    print('top cities:', Counter(r['c'] for r in out).most_common(25))
    print('bytes:', OUT.stat().st_size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
