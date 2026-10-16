import { useCallback, useEffect, useState } from 'react';

import type { ObservationHistoryItem } from '../../../shared/api/index.ts';
import { getObservationHistory } from '../api/observation-history-api.ts';

const pageSize = 20;

export function useObservationHistory(accessToken: string) {
  const [observations, setObservations] = useState<ObservationHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getObservationHistory(accessToken, 1, pageSize);
      setObservations(response.data);
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua galeria.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load remote history when session changes.
    void refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const response = await getObservationHistory(accessToken, page + 1, pageSize);
      setObservations((current) => [...current, ...response.data]);
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível carregar mais observações.',
      );
    } finally {
      setLoadingMore(false);
    }
  }, [accessToken, hasMore, loading, loadingMore, page]);

  return { observations, loading, loadingMore, hasMore, error, refresh, loadMore };
}
