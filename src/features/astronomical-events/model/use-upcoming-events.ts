import { useCallback, useEffect, useState } from 'react';

import type {
  UpcomingAstronomicalEvent,
  UpcomingAstronomicalEventType,
  UpcomingEventsMeta,
} from '../../../shared/api/index.ts';
import type { DeviceLocation } from '../../device-location/index.ts';
import { getUpcomingEvents } from '../api/events-api.ts';

export function useUpcomingEvents(
  accessToken: string,
  location: DeviceLocation | null,
  periodDays: number,
  type?: UpcomingAstronomicalEventType,
) {
  const [events, setEvents] = useState<UpcomingAstronomicalEvent[]>([]);
  const [meta, setMeta] = useState<UpcomingEventsMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!location) return;
    let disposed = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const from = startOfUtcDay(new Date());
      const to = new Date(from.getTime() + periodDays * 86_400_000);
      try {
        const response = await getUpcomingEvents(accessToken, {
          from: from.toISOString(),
          to: to.toISOString(),
          ...(type ? { type } : {}),
          observer: location,
        });
        if (!disposed) {
          setEvents(response.data);
          setMeta(response.meta);
        }
      } catch {
        if (!disposed) {
          setError('Não foi possível consultar os eventos. Tente novamente.');
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };
    void load();
    return () => {
      disposed = true;
    };
  }, [accessToken, attempt, location, periodDays, type]);

  const refresh = useCallback(() => setAttempt((value) => value + 1), []);
  return { events, meta, loading, error, refresh };
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
