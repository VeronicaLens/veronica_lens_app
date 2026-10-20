import { useCallback, useEffect, useState } from 'react';

import type { CurrentConditions } from '../../../shared/api/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getCurrentConditions } from '../api/current-conditions-api.ts';

export function useCurrentConditions(
  accessToken: string,
  location: DeviceLocation | null,
  at?: string,
) {
  const [conditions, setConditions] = useState<CurrentConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!location) return;
    let disposed = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setConditions(null);
      try {
        const result = await getCurrentConditions(accessToken, location, at);
        if (!disposed) setConditions(result);
      } catch {
        if (!disposed) {
          setError('Não foi possível consultar as condições de observação.');
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    void load();
    return () => {
      disposed = true;
    };
  }, [accessToken, at, attempt, location]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return { conditions, loading, error, refresh };
}
