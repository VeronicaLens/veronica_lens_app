import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';

import { toPermissionSnapshot, type PermissionSnapshot } from '../lib/permission-status.ts';

export type DevicePermissionKey = 'camera' | 'location' | 'notifications' | 'photos';

type ExpoSnapshots = Record<Exclude<DevicePermissionKey, 'camera'>, PermissionSnapshot | null>;

const initialSnapshots: ExpoSnapshots = { location: null, notifications: null, photos: null };

export interface DevicePermissions {
  snapshots: Record<DevicePermissionKey, PermissionSnapshot | null>;
  request(key: DevicePermissionKey): Promise<void>;
}

async function readExpoSnapshots(): Promise<ExpoSnapshots> {
  const [location, notifications, photos] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Notifications.getPermissionsAsync(),
    ImagePicker.getMediaLibraryPermissionsAsync(),
  ]);
  return {
    location: toPermissionSnapshot(location),
    notifications: toPermissionSnapshot(notifications),
    photos: toPermissionSnapshot(photos),
  };
}

/** Reads the current OS permissions and refreshes them whenever the app returns from Settings. */
export function useDevicePermissions(): DevicePermissions {
  const camera = useCameraPermission();
  const [expoSnapshots, setExpoSnapshots] = useState<ExpoSnapshots>(initialSnapshots);

  const refresh = useCallback(async () => {
    try {
      setExpoSnapshots(await readExpoSnapshots());
    } catch (cause) {
      if (__DEV__) console.warn('Could not read device permissions', cause);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial read of OS permissions.
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const request = useCallback(
    async (key: DevicePermissionKey) => {
      try {
        if (key === 'camera') await camera.requestPermission();
        else if (key === 'location') await Location.requestForegroundPermissionsAsync();
        else if (key === 'notifications') await Notifications.requestPermissionsAsync();
        else await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (cause) {
        if (__DEV__) console.warn(`Permission request failed: ${key}`, cause);
      }
      await refresh();
    },
    [camera, refresh],
  );

  const cameraSnapshot: PermissionSnapshot = {
    state:
      camera.status === 'authorized'
        ? 'granted'
        : camera.status === 'not-determined'
          ? 'undetermined'
          : 'denied',
    canAskAgain: camera.canRequestPermission,
  };

  return { snapshots: { camera: cameraSnapshot, ...expoSnapshots }, request };
}
