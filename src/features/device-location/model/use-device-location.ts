import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { DeviceLocationState } from './location.types.ts';

const initialState: DeviceLocationState = {
  status: 'requesting-permission',
  location: null,
  fallbackMessage: null,
};

export function useDeviceLocation(enabled = true) {
  const [state, setState] = useState<DeviceLocationState>(initialState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;

    const locate = async () => {
      setState(initialState);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (!disposed) {
            setState({
              status: 'permission-denied',
              location: null,
              fallbackMessage:
                'Permita o acesso à localização para calcular quais objetos estão no seu céu.',
            });
          }
          return;
        }

        if (!(await Location.hasServicesEnabledAsync())) {
          if (!disposed) {
            setState({
              status: 'services-disabled',
              location: null,
              fallbackMessage: 'Ative a localização do aparelho para alinhar o guia celeste.',
            });
          }
          return;
        }

        if (!disposed) setState({ status: 'locating', location: null, fallbackMessage: null });
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!disposed) {
          setState({
            status: 'active',
            location: {
              latitudeDegrees: position.coords.latitude,
              longitudeDegrees: position.coords.longitude,
              elevationMeters: position.coords.altitude ?? 0,
              accuracyMeters: position.coords.accuracy,
              timestamp: position.timestamp,
            },
            fallbackMessage: null,
          });
        }
      } catch {
        if (!disposed) {
          setState({
            status: 'error',
            location: null,
            fallbackMessage: 'Não foi possível obter sua localização. Tente novamente.',
          });
        }
      }
    };

    void locate();
    return () => {
      disposed = true;
    };
  }, [attempt, enabled]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, retry };
}
