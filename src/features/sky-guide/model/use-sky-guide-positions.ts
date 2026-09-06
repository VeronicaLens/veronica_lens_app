import { useCallback, useEffect, useState } from 'react';

import type { SkyGuideObjectPosition } from '../../../shared/api/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getSkyGuidePositions } from '../api/sky-guide-api.ts';

const GUIDE_OBJECT_IDS = [
  'moon',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'sirius',
  'canopus',
  'alpha-centauri',
  'arcturus',
  'vega',
  'capella',
  'rigel',
  'betelgeuse',
  'orion',
  'crux',
  'scorpius',
] as const;

export function useSkyGuidePositions(
  accessToken: string,
  location: DeviceLocation | null,
  enabled = true,
) {
  const [positions, setPositions] = useState<SkyGuideObjectPosition[]>([]);
  const [unavailableObjectIds, setUnavailableObjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !location) return;
    let disposed = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getSkyGuidePositions(accessToken, {
          objectIds: [...GUIDE_OBJECT_IDS],
          observedAt: new Date().toISOString(),
          observer: {
            latitudeDegrees: location.latitudeDegrees,
            longitudeDegrees: location.longitudeDegrees,
            elevationMeters: location.elevationMeters,
          },
        });
        if (!disposed) {
          setPositions(result.positions);
          setUnavailableObjectIds(result.unavailableObjectIds);
        }
      } catch (cause) {
        if (!disposed) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os objetos visíveis.',
          );
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void load();
    return () => {
      disposed = true;
    };
  }, [accessToken, attempt, enabled, location]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return { positions, unavailableObjectIds, loading, error, refresh };
}
