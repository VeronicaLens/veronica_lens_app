import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ObservationRecommendation } from '../../../shared/api/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getObservationRecommendation } from '../api/observation-planning-api.ts';

const RECOMMENDATION_WINDOW_MS = 24 * 60 * 60 * 1_000;
const RECOMMENDATION_CACHE_TTL_MS = 5 * 60 * 1_000;

interface RecommendationRequest {
  objectId: string;
  windowFrom: string;
  windowTo: string;
  observer: {
    latitudeDegrees: number;
    longitudeDegrees: number;
    elevationMeters: number;
  };
  minimumAltitudeDegrees: number;
}

interface RecommendationState {
  key: string;
  status: 'loading' | 'success' | 'error';
  recommendation?: ObservationRecommendation;
  error?: string;
}

const recommendationCache = new Map<
  string,
  { recommendation: ObservationRecommendation; expiresAt: number }
>();
const pendingRecommendations = new Map<string, Promise<ObservationRecommendation>>();

export function useObservationRecommendation(
  accessToken: string,
  objectId: string | null,
  location: DeviceLocation | null,
  windowFrom?: string,
) {
  const [defaultWindowFrom] = useState(() => new Date().toISOString());
  const [result, setResult] = useState<RecommendationState | null>(null);
  const [attempt, setAttempt] = useState(0);
  const from = windowFrom ?? defaultWindowFrom;
  const latitudeDegrees = location?.latitudeDegrees;
  const longitudeDegrees = location?.longitudeDegrees;
  const elevationMeters = location?.elevationMeters;
  const request = useMemo<RecommendationRequest | null>(
    () =>
      objectId &&
      latitudeDegrees !== undefined &&
      longitudeDegrees !== undefined &&
      elevationMeters !== undefined
        ? {
            objectId,
            windowFrom: from,
            windowTo: new Date(new Date(from).getTime() + RECOMMENDATION_WINDOW_MS).toISOString(),
            observer: { latitudeDegrees, longitudeDegrees, elevationMeters },
            minimumAltitudeDegrees: 30,
          }
        : null,
    [elevationMeters, from, latitudeDegrees, longitudeDegrees, objectId],
  );
  const requestKey = request ? JSON.stringify(request) : '';

  useEffect(() => {
    if (!request || !requestKey) return;
    let disposed = false;

    const load = async () => {
      const cached = recommendationCache.get(requestKey);
      if (cached && cached.expiresAt > Date.now()) {
        setResult({ key: requestKey, status: 'success', recommendation: cached.recommendation });
        return;
      }
      recommendationCache.delete(requestKey);
      setResult((current) => ({
        key: requestKey,
        status: 'loading',
        ...(current?.key === requestKey && current.recommendation
          ? { recommendation: current.recommendation }
          : {}),
      }));

      try {
        const recommendation = await loadRecommendation(accessToken, request, requestKey);
        if (!disposed) setResult({ key: requestKey, status: 'success', recommendation });
      } catch (cause) {
        if (!disposed) {
          setResult({
            key: requestKey,
            status: 'error',
            error:
              cause instanceof Error
                ? cause.message
                : 'Não foi possível calcular a melhor janela de observação.',
          });
        }
      }
    };

    void load();
    return () => {
      disposed = true;
    };
  }, [accessToken, attempt, request, requestKey]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  const currentResult = result?.key === requestKey ? result : null;
  return {
    recommendation: currentResult?.recommendation ?? null,
    loading: currentResult?.status === 'loading',
    error: currentResult?.status === 'error' ? (currentResult.error ?? null) : null,
    refresh,
  };
}

function loadRecommendation(
  accessToken: string,
  request: RecommendationRequest,
  key: string,
): Promise<ObservationRecommendation> {
  const pending = pendingRecommendations.get(key);
  if (pending) return pending;

  const promise = getObservationRecommendation(accessToken, request)
    .then((recommendation) => {
      recommendationCache.set(key, {
        recommendation,
        expiresAt: Date.now() + RECOMMENDATION_CACHE_TTL_MS,
      });
      if (recommendationCache.size > 50) {
        const oldestKey = recommendationCache.keys().next().value;
        if (oldestKey) recommendationCache.delete(oldestKey);
      }
      return recommendation;
    })
    .finally(() => pendingRecommendations.delete(key));
  pendingRecommendations.set(key, promise);
  return promise;
}
