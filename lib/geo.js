// Country names match the `name` property in world-atlas@2 countries-110m.json,
// so a click on the map can be joined straight to rows in the database.
const RAW = {
  Asia: [
    'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia',
    'China', 'Cyprus', 'N. Cyprus', 'Georgia', 'Hong Kong', 'India', 'Indonesia', 'Iran', 'Iraq',
    'Israel', 'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia',
    'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Oman', 'Pakistan', 'Palestine',
    'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Korea', 'Sri Lanka', 'Syria', 'Taiwan',
    'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan', 'United Arab Emirates',
    'Uzbekistan', 'Vietnam', 'Yemen',
  ],
  Europe: [
    'Albania', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herz.', 'Bulgaria', 'Croatia', 'Czechia',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland',
    'Italy', 'Kosovo', 'Latvia', 'Lithuania', 'Luxembourg', 'Macedonia', 'Malta', 'Moldova',
    'Montenegro', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'Serbia',
    'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom',
  ],
  Africa: [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
    'Central African Rep.', 'Chad', 'Congo', 'Dem. Rep. Congo', "Côte d'Ivoire", 'Djibouti', 'Egypt',
    'Eq. Guinea', 'Eritrea', 'eSwatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea',
    'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali',
    'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda',
    'Senegal', 'Sierra Leone', 'Somalia', 'Somaliland', 'South Africa', 'S. Sudan', 'Sudan',
    'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'W. Sahara', 'Zambia', 'Zimbabwe',
  ],
  'North America': [
    'Bahamas', 'Belize', 'Canada', 'Costa Rica', 'Cuba', 'Dominican Rep.', 'El Salvador', 'Greenland',
    'Guatemala', 'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama', 'Puerto Rico',
    'Trinidad and Tobago', 'United States of America',
  ],
  'South America': [
    'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Falkland Is.', 'Guyana',
    'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela',
  ],
  Oceania: [
    'Australia', 'Fiji', 'New Caledonia', 'New Zealand', 'Papua New Guinea', 'Solomon Is.', 'Vanuatu',
  ],
};

export const CONTINENTS = [
  { name: 'Asia', slug: 'asia', center: [92, 28], zoom: 2.1 },
  { name: 'Europe', slug: 'europe', center: [18, 53], zoom: 3.6 },
  { name: 'Africa', slug: 'africa', center: [20, 2], zoom: 2.4 },
  { name: 'North America', slug: 'north-america', center: [-96, 42], zoom: 2.2 },
  { name: 'South America', slug: 'south-america', center: [-60, -20], zoom: 2.4 },
  { name: 'Oceania', slug: 'oceania', center: [148, -26], zoom: 3 },
];

export const WORLD_VIEW = { center: [10, 12], zoom: 1 };

export const CONTINENT_OF = {};
for (const [continent, list] of Object.entries(RAW)) {
  for (const country of list) CONTINENT_OF[country] = continent;
}

const PRETTY = {
  'United States of America': 'United States',
  'Dem. Rep. Congo': 'DR Congo',
  'Central African Rep.': 'Central African Republic',
  'Bosnia and Herz.': 'Bosnia & Herzegovina',
  'Dominican Rep.': 'Dominican Republic',
  'Eq. Guinea': 'Equatorial Guinea',
  'S. Sudan': 'South Sudan',
  'Solomon Is.': 'Solomon Islands',
  'Falkland Is.': 'Falkland Islands',
  'W. Sahara': 'Western Sahara',
  'N. Cyprus': 'Northern Cyprus',
  Macedonia: 'North Macedonia',
  eSwatini: 'Eswatini',
};

export function prettyName(country) {
  return PRETTY[country] || country;
}

export const COUNTRIES = Object.keys(CONTINENT_OF).sort((a, b) =>
  prettyName(a).localeCompare(prettyName(b))
);

export function continentByName(name) {
  return CONTINENTS.find((c) => c.name === name) || null;
}
