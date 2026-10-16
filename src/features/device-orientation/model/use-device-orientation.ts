import { useCallback, useEffect, useMemo, useState } from 'react';

import { ExpoOrientationSource } from '../api/expo-orientation-source.ts';
import {
  DeviceOrientationService,
  initialDeviceOrientationState,
} from './device-orientation.service.ts';

export function useDeviceOrientation(enabled = true) {
  const [state, setState] = useState(initialDeviceOrientationState);
  const [attempt, setAttempt] = useState(0);
  const service = useMemo(() => new DeviceOrientationService(new ExpoOrientationSource()), []);

  useEffect(() => {
    if (!enabled) {
      // The disabled state intentionally clears readings from a previous subscription.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(initialDeviceOrientationState);
      return;
    }

    let disposed = false;
    let stop: (() => void) | undefined;

    void service
      .start((nextState) => {
        if (!disposed) setState(nextState);
      })
      .then((stopSubscription) => {
        if (disposed) stopSubscription();
        else stop = stopSubscription;
      });

    return () => {
      disposed = true;
      stop?.();
    };
  }, [attempt, enabled, service]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, retry };
}
