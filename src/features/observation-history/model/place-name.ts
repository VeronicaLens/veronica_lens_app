export interface GeocodedPlace {
  city: string | null;
  district: string | null;
  subregion: string | null;
  region: string | null;
  country: string | null;
  isoCountryCode: string | null;
}

const brazilianStates: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
};

/**
 * Builds a short, human-friendly place label such as "Indaiatuba, SP · Brasil".
 * Brazilian state names are abbreviated to their two-letter code.
 */
export function formatPlaceName(place: GeocodedPlace): string | null {
  const city = clean(place.city) ?? clean(place.subregion) ?? clean(place.district);
  const region = abbreviateRegion(clean(place.region), place.isoCountryCode);
  const country = clean(place.country);
  const local = [city, region].filter(
    (value, index, values) => value && values.indexOf(value) === index,
  );
  const label = [local.join(', '), country].filter(Boolean).join(' · ');
  return label || null;
}

/** Rounds coordinates (~110 m) so nearby photos share one geocoding request. */
export function placeCacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
}

function abbreviateRegion(region: string | null, isoCountryCode: string | null): string | null {
  if (!region || isoCountryCode?.toUpperCase() !== 'BR') return region;
  const normalized = region
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^estado d[eo]s?\s+/i, '')
    .toLowerCase()
    .trim();
  return brazilianStates[normalized] ?? region;
}

function clean(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
