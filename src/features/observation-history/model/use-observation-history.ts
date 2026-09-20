import { useCallback, useEffect, useState } from 'react';

import type { ObservationHistoryItem } from '../../../shared/api/index.ts';
import { getObservationHistory } from '../api/observation-history-api.ts';

export function useObservationHistory(accessToken: string) {
  const [observations, setObservations] = useState<ObservationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setObservations(await getObservationHistory(accessToken));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar seu histórico.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load remote history when session changes.
    void load();
  }, [load]);

  return { observations, loading, error, load };
}
