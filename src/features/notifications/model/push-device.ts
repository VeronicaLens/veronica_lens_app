import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { PushDevicePlatform } from '../../../shared/api/index.ts';
import { registerPushDevice, unregisterPushDevice } from '../api/notifications-api.ts';

const PUSH_TOKEN_KEY = 'veronica_lens_push_token_v1';
const expoProjectId = '820ebbe7-b234-4aa6-82a6-4d094cead7ad';

export type PushRegistrationResult =
  | { status: 'registered' }
  | { status: 'denied'; message: string }
  | { status: 'unavailable'; message: string };

export async function requestAndRegisterPushDevice(
  accessToken: string,
): Promise<PushRegistrationResult> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return {
      status: 'unavailable',
      message: 'Alertas push estão disponíveis apenas no aplicativo.',
    };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('astronomy-alerts', {
      name: 'Alertas astronômicos',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    return { status: 'denied', message: 'A permissão de notificações não foi concedida.' };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: expoProjectId })).data;
    await registerPushDevice(accessToken, token, Platform.OS as PushDevicePlatform);
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return { status: 'registered' };
  } catch {
    return {
      status: 'unavailable',
      message: 'Não foi possível registrar este dispositivo para alertas.',
    };
  }
}

export async function deactivateStoredPushDevice(accessToken: string): Promise<void> {
  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  try {
    if (token) await unregisterPushDevice(accessToken, token);
  } catch {
    // Invalid sessions and offline logout must still remove the local device association.
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
}

export async function clearStoredPushDevice(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}
