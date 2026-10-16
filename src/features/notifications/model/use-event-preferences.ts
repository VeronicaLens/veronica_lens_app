import { useCallback, useEffect, useState } from 'react';

import type { EventPreference } from '../../../shared/api/index.ts';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../api/notifications-api.ts';

const defaults: EventPreference[] = [
  { eventType: 'rise', enabled: true, leadMinutes: 30 },
  { eventType: 'transit', enabled: true, leadMinutes: 30 },
  { eventType: 'set', enabled: true, leadMinutes: 30 },
];

export function useEventPreferences(accessToken: string) {
  const [preferences, setPreferences] = useState<EventPreference[]>(defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const saved = await getNotificationPreferences(accessToken);
      const savedByType = new Map(saved.map((preference) => [preference.eventType, preference]));
      setPreferences(
        defaults.map((preference) => savedByType.get(preference.eventType) ?? preference),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar alertas.');
    }
  }, [accessToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronize event alerts with the authenticated account.
    void load();
  }, [load]);

  const setEnabled = useCallback(
    async (eventType: string, enabled: boolean) => {
      const next = preferences.map((preference) =>
        preference.eventType === eventType ? { ...preference, enabled } : preference,
      );
      setPreferences(next);
      setSaving(true);
      setError(null);
      try {
        const saved = await updateNotificationPreferences(accessToken, next);
        setPreferences(saved);
      } catch (cause) {
        setPreferences(preferences);
        setError(cause instanceof Error ? cause.message : 'Não foi possível salvar alertas.');
      } finally {
        setSaving(false);
      }
    },
    [accessToken, preferences],
  );

  return { preferences, saving, error, setEnabled };
}
