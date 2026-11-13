// Indian cities on the map: [longitude, latitude], and the other spellings
// people (and careers pages) use for them. Neighbourhoods fold into their city.
export const INDIA_CITIES = {
  Bengaluru: [77.5946, 12.9716],
  Mumbai: [72.8777, 19.076],
  Delhi: [77.209, 28.6139],
  Gurugram: [77.0266, 28.4595],
  Noida: [77.391, 28.5355],
  Pune: [73.8567, 18.5204],
  Hyderabad: [78.4867, 17.385],
  Chennai: [80.2707, 13.0827],
  Ahmedabad: [72.5714, 23.0225],
  Jaipur: [75.7873, 26.9124],
  Kolkata: [88.3639, 22.5726],
  Indore: [75.8577, 22.7196],
  Chandigarh: [76.7794, 30.7333],
  Kochi: [76.2673, 9.9312],
  Goa: [73.8278, 15.4909],
  Vadodara: [73.1812, 22.3072],
  Coimbatore: [76.9558, 11.0168],
  Thane: [72.9781, 19.2183],
  Kanpur: [80.3319, 26.4499],
  Bhopal: [77.4126, 23.2599],
  Thiruvananthapuram: [76.9366, 8.5241],
  Surat: [72.8311, 21.1702],
  Faridabad: [77.3178, 28.4089],
  Nagpur: [79.0882, 21.1458],
  Jodhpur: [73.0243, 26.2389],
  Ghaziabad: [77.4538, 28.6692],
  Lucknow: [80.9462, 26.8467],
  Belagavi: [74.4977, 15.8497],
  Udupi: [74.7421, 13.3409],
  Mohali: [76.7179, 30.7046],
  Patna: [85.1376, 25.5941],
  Bhubaneswar: [85.8245, 20.2961],
  Warangal: [79.5941, 17.9689],
  Varanasi: [82.9739, 25.3176],
  Dehradun: [78.0322, 30.3165],
  Gwalior: [78.1828, 26.2183],
  Roorkee: [77.888, 29.8543],
  Gandhinagar: [72.6369, 23.2156],
  Ludhiana: [75.8573, 30.901],
  Panchkula: [76.8606, 30.6942],
  Udaipur: [73.7125, 24.5854],
  Srinagar: [74.7973, 34.0837],
  Mangaluru: [74.856, 12.9141],
  Guwahati: [91.7362, 26.1445],
  Kota: [75.8648, 25.2138],
  Mysuru: [76.6394, 12.2958],
  Visakhapatnam: [83.2185, 17.6868],
  Nashik: [73.7898, 19.9975],
  Rajkot: [70.8022, 22.3039],
  Amritsar: [74.8723, 31.634],
  Ranchi: [85.3096, 23.3441],
  Raipur: [81.6296, 21.2514],
  Madurai: [78.1198, 9.9252],
  Vijayawada: [80.648, 16.5062],
};

const ALIASES = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  koramangala: 'Bengaluru',
  kormangala: 'Bengaluru',
  'hsr layout': 'Bengaluru',
  whitefield: 'Bengaluru',
  bombay: 'Mumbai',
  andheri: 'Mumbai',
  powai: 'Mumbai',
  worli: 'Mumbai',
  chembur: 'Mumbai',
  'navi mumbai': 'Mumbai',
  'new delhi': 'Delhi',
  gurgaon: 'Gurugram',
  'greater noida': 'Noida',
  taramani: 'Chennai',
  madras: 'Chennai',
  calcutta: 'Kolkata',
  kolkatta: 'Kolkata',
  bhubneswar: 'Bhubaneswar',
  cochin: 'Kochi',
  ernakulam: 'Kochi',
  trivandrum: 'Thiruvananthapuram',
  panaji: 'Goa',
  mangalore: 'Mangaluru',
  mysore: 'Mysuru',
  vizag: 'Visakhapatnam',
  baroda: 'Vadodara',
  secunderabad: 'Hyderabad',
};

// Longest names first, so "Navi Mumbai" wins over "Mumbai" and "New Delhi" over "Delhi".
const KEYS = [...Object.keys(INDIA_CITIES).map((c) => c.toLowerCase()), ...Object.keys(ALIASES)]
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort((a, b) => b.length - a.length);
const CANON = Object.fromEntries(Object.keys(INDIA_CITIES).map((c) => [c.toLowerCase(), c]));

// The map city for a free-text city or job location ("Bangalore, KA, India"), or null.
export function indiaCity(text) {
  if (!text) return null;
  const t = ` ${String(text).toLowerCase().replace(/[^a-z ]+/g, ' ')} `;
  for (const k of KEYS) {
    if (t.includes(` ${k} `)) return ALIASES[k] || CANON[k];
  }
  return null;
}

// Spellings to look for in job locations when filtering by a city.
export function citySpellings(city) {
  if (!INDIA_CITIES[city]) return [];
  return [city, ...Object.entries(ALIASES).filter(([k, v]) => v === city && k !== city.toLowerCase()).map(([k]) => k)];
}

export const INDIA_VIEW = { center: [80.5, 22.5], zoom: 4 };
