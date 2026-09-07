import { useCallback, useEffect, useState } from 'react';

import type { ObservationRecommendation } from '../../../shared/api/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getObservationRecommendation } from '../api/observation-planning-api.ts';

const RECOMMENDATION_WINDOW_MS = 24 * 60 * 60 * 1_000;

export function useObservationRecommendation(
  accessToken: string,
  objectId: string | null,
  location: DeviceLocation | null,
) {
  const [recommendation, setRecommendation] = useState<ObservationRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!objectId || !location) return;
    let disposed = false;

    const load = async () => {
      setRecommendation(null);
      setError(null);
      setLoading(true);
      const now = new Date();
      try {
        const result = await getObservationRecommendation(accessToken, {
          objectId,
          windowFrom: now.toISOString(),
          windowTo: new Date(now.getTime() + RECOMMENDATION_WINDOW_MS).toISOString(),
          observer: {
            latitudeDegrees: location.latitudeDegrees,
            longitudeDegrees: location.longitudeDegrees,
            elevationMeters: location.elevationMeters,
          },
          minimumAltitudeDegrees: 30,
        });
        if (!disposed) setRecommendation(result);
      } catch (cause) {
        if (!disposed) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível calcular a melhor janela de observação.',
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
  }, [accessToken, attempt, location, objectId]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  const enabled = Boolean(objectId && location);
  return {
    recommendation: enabled ? recommendation : null,
    loading: enabled && loading,
    error: enabled ? error : null,
    refresh,
  };
}
