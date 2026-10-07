import { INDUSTRIES } from './constants';

// Maps free-text industry/sector labels (e.g. from a CSV) onto Atlas categories.
const RULES = [
  ['Education', /ed\w*tech|education|e-?learning|school|tutor|coaching|\bexam|course|skill|university|student/],
  ['Health', /health|medic|hospital|pharma|doctor|diagnos|wellness|fitness|clinic|biotech|medtech|patient|dental|ayurved|life ?science/],
  ['Fintech', /fintech|financ|payment|lending|loan|credit|insur|bank|wallet|invest|wealth|crypto|accounting|\btax\b|neobank|remittance/],
  ['Food & Agri', /food|agri|farm|dairy|restaurant|beverage|\btea\b|coffee|kitchen|meal|grocery|snack|bakery|organic|fishery|poultry|nutrition/],
  ['Travel & Hospitality', /travel|hotel|hospitality|\btour|holiday|booking|airline|vacation|homestay/],
  ['Gaming & Entertainment', /gaming|\bgames?\b|esport|fantasy|entertainment|movie|\bfilm|music|\bevents?\b|animation|\bsports?\b/],
  ['Media & Creators', /media|content|news|publish|creator|influencer|social|community|advertis|marketing|matrimon/],
  ['Real Estate & Housing', /real ?estate|property|housing|interior|construction|co-?living|co-?working|furniture|architect|proptech|home services/],
  ['HR & Work', /\bhr\b|hrtech|recruit|hiring|\bjobs?\b|talent|staffing|payroll|workforce|freelanc|human resource/],
  ['Logistics', /logistic|delivery|courier|shipping|supply chain|freight|warehous|last.mile|fleet/],
  ['Mobility', /mobility|transport|\bcabs?\b|taxi|automotive|automobile|vehicle|\bcars?\b|\bev\b|electric vehicle|aviation|drone/],
  ['Climate & Energy', /energy|solar|clean ?tech|renewable|climate|waste|recycl|sustainab|water|environment|carbon|battery|green ?tech/],
  ['Government & Civic', /govt|government|civic|public sector|non-?profit|ngo|social impact/],
  ['SaaS & B2B', /saas|b2b|enterprise|crm|erp|software|cloud|\bit\b|it services|analytics|data|security|cyber|iot|hardware|manufactur|industrial|telecom|consult/],
  ['AI & Software', /\bai\b|artificial intelligence|machine learning|deep ?tech|robot|computer vision|blockchain|\bar\b|\bvr\b|space|tech/],
  ['Commerce', /commerce|retail|shop|store|fashion|apparel|cloth|beauty|cosmetic|personal care|jewel|footwear|d2c|consumer|marketplace|textile|fmcg|lifestyle|toys|pet/],
];

export function categorize(...labels) {
  const text = labels.filter(Boolean).join(' ').toLowerCase();
  const exact = INDUSTRIES.find((i) => i.toLowerCase() === text.trim());
  if (exact) return exact;
  for (const [name, re] of RULES) if (re.test(text)) return name;
  return 'Other';
}
