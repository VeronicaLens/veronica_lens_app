import { useCallback, useEffect, useState } from 'react';

import type { Profile, UpdateProfileRequest } from '../../../shared/api/index.ts';
import { getProfile, updateProfile } from '../api/profile-api.ts';

export function useProfile(accessToken: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getProfile(accessToken));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar seu perfil.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // The effect intentionally starts synchronization with the remote profile.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const save = useCallback(
    async (input: UpdateProfileRequest) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await updateProfile(accessToken, input);
        setProfile(updated);
        return updated;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível salvar seu perfil.');
        return null;
      } finally {
        setSaving(false);
      }
    },
    [accessToken],
  );

  return { profile, loading, saving, error, load, save };
}
