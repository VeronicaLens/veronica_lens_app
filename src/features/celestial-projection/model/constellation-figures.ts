import { projectCelestialDirection } from './celestial-projection.ts';
import type { HorizontalCoordinates, ProjectionContext } from './celestial-projection.types.ts';

export interface EquatorialStar {
  name: string;
  rightAscensionDegrees: number;
  declinationDegrees: number;
  magnitude: number;
}

export interface ConstellationFigure {
  id: string;
  stars: Record<string, EquatorialStar>;
  lines: readonly (readonly [string, string])[];
}

export interface GeographicObserver {
  latitudeDegrees: number;
  longitudeDegrees: number;
}

export interface ProjectedFigureStar {
  key: string;
  name: string;
  magnitude: number;
  x: number;
  y: number;
}

export interface ProjectedFigureSegment {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ProjectedConstellationFigure {
  id: string;
  stars: ProjectedFigureStar[];
  segments: ProjectedFigureSegment[];
}

const DEGREES_TO_RADIANS = Math.PI / 180;
const JULIAN_DATE_UNIX_EPOCH = 2_440_587.5;
const JULIAN_DATE_J2000 = 2_451_545;
const MILLISECONDS_PER_DAY = 86_400_000;

function star(
  name: string,
  rightAscensionDegrees: number,
  declinationDegrees: number,
  magnitude: number,
): EquatorialStar {
  return { name, rightAscensionDegrees, declinationDegrees, magnitude };
}

// J2000 positions of the bright stars that form the classic stick figures.
export const constellationFigures: readonly ConstellationFigure[] = [
  {
    id: 'orion',
    stars: {
      betelgeuse: star('Betelgeuse', 88.7929, 7.4071, 0.42),
      bellatrix: star('Bellatrix', 81.2828, 6.3497, 1.64),
      meissa: star('Meissa', 83.7845, 9.9342, 3.39),
      mintaka: star('Mintaka', 83.0017, -0.2991, 2.23),
      alnilam: star('Alnilam', 84.0534, -1.2019, 1.69),
      alnitak: star('Alnitak', 85.1897, -1.9426, 1.77),
      saiph: star('Saiph', 86.9391, -9.6696, 2.06),
      rigel: star('Rigel', 78.6345, -8.2016, 0.13),
    },
    lines: [
      ['meissa', 'betelgeuse'],
      ['meissa', 'bellatrix'],
      ['betelgeuse', 'bellatrix'],
      ['betelgeuse', 'alnitak'],
      ['bellatrix', 'mintaka'],
      ['mintaka', 'alnilam'],
      ['alnilam', 'alnitak'],
      ['alnitak', 'saiph'],
      ['mintaka', 'rigel'],
    ],
  },
  {
    id: 'crux',
    stars: {
      acrux: star('Acrux', 186.6496, -63.0991, 0.76),
      mimosa: star('Mimosa', 191.9303, -59.6888, 1.25),
      gacrux: star('Gacrux', 187.7915, -57.1132, 1.64),
      imai: star('Imai', 183.7863, -58.7489, 2.79),
    },
    lines: [
      ['gacrux', 'acrux'],
      ['mimosa', 'imai'],
    ],
  },
  {
    id: 'scorpius',
    stars: {
      acrab: star('Acrab', 241.3593, -19.8054, 2.62),
      dschubba: star('Dschubba', 240.0834, -22.6217, 2.29),
      fang: star('Fang', 239.713, -26.1141, 2.89),
      alniyat: star('Alniyat', 245.2971, -25.5928, 2.89),
      antares: star('Antares', 247.3519, -26.432, 0.91),
      paikauhale: star('Paikauhale', 248.9706, -28.216, 2.82),
      larawag: star('Larawag', 252.5409, -34.2933, 2.29),
      xamidimura: star('Xamidimura', 252.9676, -38.0474, 3.0),
      zeta: star('Zeta Scorpii', 253.6459, -42.3613, 3.62),
      eta: star('Eta Scorpii', 258.0383, -43.2392, 3.33),
      sargas: star('Sargas', 264.3297, -42.9978, 1.86),
      iota: star('Iota Scorpii', 266.8962, -40.127, 2.99),
      girtab: star('Girtab', 265.6221, -39.03, 2.39),
      shaula: star('Shaula', 263.4022, -37.1038, 1.62),
      lesath: star('Lesath', 262.691, -37.2958, 2.7),
    },
    lines: [
      ['acrab', 'dschubba'],
      ['dschubba', 'fang'],
      ['dschubba', 'alniyat'],
      ['alniyat', 'antares'],
      ['antares', 'paikauhale'],
      ['paikauhale', 'larawag'],
      ['larawag', 'xamidimura'],
      ['xamidimura', 'zeta'],
      ['zeta', 'eta'],
      ['eta', 'sargas'],
      ['sargas', 'iota'],
      ['iota', 'girtab'],
      ['girtab', 'shaula'],
      ['shaula', 'lesath'],
    ],
  },
  {
    id: 'ursa-major',
    stars: {
      dubhe: star('Dubhe', 165.932, 61.751, 1.79),
      merak: star('Merak', 165.4603, 56.3824, 2.37),
      phecda: star('Phecda', 178.4577, 53.6948, 2.44),
      megrez: star('Megrez', 183.8565, 57.0326, 3.31),
      alioth: star('Alioth', 193.5073, 55.9598, 1.77),
      mizar: star('Mizar', 200.9814, 54.9254, 2.27),
      alkaid: star('Alkaid', 206.8852, 49.3133, 1.86),
    },
    lines: [
      ['dubhe', 'merak'],
      ['merak', 'phecda'],
      ['phecda', 'megrez'],
      ['megrez', 'dubhe'],
      ['megrez', 'alioth'],
      ['alioth', 'mizar'],
      ['mizar', 'alkaid'],
    ],
  },
];

/**
 * Converts J2000 equatorial coordinates to local horizontal coordinates.
 * Precession and refraction are ignored, which is accurate enough for an AR overlay.
 */
export function equatorialToHorizontal(
  equatorial: Pick<EquatorialStar, 'rightAscensionDegrees' | 'declinationDegrees'>,
  observer: GeographicObserver,
  observedAt: Date,
): HorizontalCoordinates {
  const localSiderealTime = normalizeDegrees(
    greenwichMeanSiderealTimeDegrees(observedAt) + observer.longitudeDegrees,
  );
  const hourAngle = (localSiderealTime - equatorial.rightAscensionDegrees) * DEGREES_TO_RADIANS;
  const declination = equatorial.declinationDegrees * DEGREES_TO_RADIANS;
  const latitude = observer.latitudeDegrees * DEGREES_TO_RADIANS;

  const sinAltitude = clamp(
    Math.sin(declination) * Math.sin(latitude) +
      Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle),
    -1,
    1,
  );
  const y = -Math.sin(hourAngle) * Math.cos(declination);
  const x =
    Math.sin(declination) * Math.cos(latitude) -
    Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle);

  return {
    altitudeDegrees: Math.asin(sinAltitude) / DEGREES_TO_RADIANS,
    azimuthDegrees:
      Math.abs(x) < Number.EPSILON && Math.abs(y) < Number.EPSILON
        ? 0
        : normalizeDegrees(Math.atan2(y, x) / DEGREES_TO_RADIANS),
  };
}

export function projectConstellationFigure(
  figure: ConstellationFigure,
  observer: GeographicObserver,
  observedAt: Date,
  context: ProjectionContext,
): ProjectedConstellationFigure | null {
  const margin = Math.max(context.viewport.width, context.viewport.height) * 0.5;
  const projected = new Map<string, ProjectedFigureStar>();

  for (const [key, entry] of Object.entries(figure.stars)) {
    const horizontal = equatorialToHorizontal(entry, observer, observedAt);
    const point = projectCelestialDirection(horizontal, context);
    if (point) {
      projected.set(key, {
        key,
        name: entry.name,
        magnitude: entry.magnitude,
        x: point.x,
        y: point.y,
      });
    }
  }

  const insideViewport = (point: ProjectedFigureStar, extra = 0) =>
    point.x >= -extra &&
    point.x <= context.viewport.width + extra &&
    point.y >= -extra &&
    point.y <= context.viewport.height + extra;

  const segments = figure.lines.flatMap(([from, to]) => {
    const start = projected.get(from);
    const end = projected.get(to);
    if (!start || !end) return [];
    if (!insideViewport(start, margin) || !insideViewport(end, margin)) return [];
    if (!insideViewport(start) && !insideViewport(end)) return [];
    return [{ key: `${from}-${to}`, x1: start.x, y1: start.y, x2: end.x, y2: end.y }];
  });
  const stars = [...projected.values()].filter((point) => insideViewport(point));

  return segments.length > 0 || stars.length > 0 ? { id: figure.id, stars, segments } : null;
}

function greenwichMeanSiderealTimeDegrees(observedAt: Date): number {
  const julianDate = observedAt.getTime() / MILLISECONDS_PER_DAY + JULIAN_DATE_UNIX_EPOCH;
  const daysSinceJ2000 = julianDate - JULIAN_DATE_J2000;
  const centuries = daysSinceJ2000 / 36_525;
  return normalizeDegrees(
    280.46061837 +
      360.98564736629 * daysSinceJ2000 +
      0.000387933 * centuries ** 2 -
      centuries ** 3 / 38_710_000,
  );
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
