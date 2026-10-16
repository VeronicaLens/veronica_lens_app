import { useCallback, useEffect, useState } from 'react';

import type { CurrentConditionsForecast } from '../../../shared/api/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getConditionsForecast } from '../api/current-conditions-api.ts';

export function useConditionsForecast(accessToken: string, location: DeviceLocation | null) {
  const [forecast, setForecast] = useState<CurrentConditionsForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!location) return;

    let disposed = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setForecast(null);
      try {
        const result = await getConditionsForecast(accessToken, location);
        if (!disposed) setForecast(result);
      } catch {
        if (!disposed) {
          setError('Não foi possível carregar a previsão para os próximos dias.');
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    void load();
    return () => {
      disposed = true;
    };
  }, [accessToken, attempt, location]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return {
    forecast: location ? forecast : null,
    loading: Boolean(location && loading),
    error: location ? error : null,
    refresh,
  };
}
