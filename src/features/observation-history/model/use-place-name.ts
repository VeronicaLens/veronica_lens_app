import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { formatPlaceName, placeCacheKey } from './place-name.ts';

const placeCache = new Map<string, Promise<string | null>>();

export type PlaceNameState =
  { status: 'idle' | 'loading' | 'unavailable'; label: null } | { status: 'ready'; label: string };

/**
 * Resolves a friendly place name on the device. It never prompts for permission: when location
 * access was not granted the caller keeps showing the raw coordinates.
 */
export function usePlaceName(latitude: number | null, longitude: number | null): PlaceNameState {
  const key = latitude === null || longitude === null ? null : placeCacheKey(latitude, longitude);
  const [state, setState] = useState<{ key: string | null; value: PlaceNameState }>({
    key: null,
    value: { status: 'idle', label: null },
  });

  useEffect(() => {
    if (key === null || latitude === null || longitude === null) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show progress while geocoding.
    setState({ key, value: { status: 'loading', label: null } });
    void resolvePlaceName(key, latitude, longitude).then((label) => {
      if (cancelled) return;
      setState({
        key,
        value: label ? { status: 'ready', label } : { status: 'unavailable', label: null },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [key, latitude, longitude]);

  if (key === null) return { status: 'unavailable', label: null };
  return state.key === key ? state.value : { status: 'loading', label: null };
}

function resolvePlaceName(key: string, latitude: number, longitude: number) {
  const cached = placeCache.get(key);
  if (cached) return cached;

  const request = (async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return address ? formatPlaceName(address) : null;
  })().catch(() => null);

  placeCache.set(key, request);
  // Failed lookups are retried the next time the photo is opened.
  void request.then((label) => {
    if (label === null) placeCache.delete(key);
  });
  return request;
}
