import type { LucideIconName } from '@react-native-vector-icons/lucide';

import type { ObservationHistoryItem } from '../../../shared/api/index.ts';

export type ObservationCategory = 'moon' | 'planet' | 'other';

export const observationCategoryConfig: Record<
  ObservationCategory,
  { icon: LucideIconName; label: string }
> = {
  moon: { icon: 'moon', label: 'Lua' },
  planet: { icon: 'orbit', label: 'Planetas' },
  other: { icon: 'sparkles', label: 'Céu profundo' },
};

const planetNames = [
  'mercúrio',
  'vênus',
  'terra',
  'marte',
  'júpiter',
  'saturno',
  'urano',
  'netuno',
];

/** Heuristic classification: the API has no structured object category, only free text. */
export function categorizeObservation(observation: ObservationHistoryItem): ObservationCategory {
  const name = observation.celestialObjectName?.toLowerCase() ?? '';
  if (name.includes('lua')) return 'moon';
  if (planetNames.some((planet) => name.includes(planet))) return 'planet';
  return 'other';
}
