import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { PushDevicePlatform } from '../../../shared/api/index.ts';
import { registerPushDevice, unregisterPushDevice } from '../api/notifications-api.ts';
import { describePushRegistrationError } from '../lib/push-registration-error.ts';

const PUSH_TOKEN_KEY = 'veronica_lens_push_token_v1';
const expoProjectId = '820ebbe7-b234-4aa6-82a6-4d094cead7ad';
/** Must match the channel id sent by the API push provider. */
export const ASTRONOMY_ALERTS_CHANNEL_ID = 'astronomy-alerts';

export type PushRegistrationResult =
  | { status: 'registered' }
  | { status: 'denied'; message: string }
  | { status: 'unavailable'; message: string };

/** Shows alerts as banners even while the app is open (Expo hides them by default). */
export function configureNotificationPresentation(): void {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
  });
}

export async function requestAndRegisterPushDevice(
  accessToken: string,
): Promise<PushRegistrationResult> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return {
      status: 'unavailable',
      message: 'Alertas push estão disponíveis apenas no aplicativo.',
    };
  }

  await ensureAlertsChannel();

  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    return { status: 'denied', message: 'A permissão de notificações não foi concedida.' };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: expoProjectId })).data;
    await registerPushDevice(accessToken, token, Platform.OS as PushDevicePlatform);
    await storeToken(token);
    return { status: 'registered' };
  } catch (cause) {
    if (__DEV__) console.warn('Push registration failed', cause);
    return { status: 'unavailable', message: describePushRegistrationError(cause) };
  }
}

/**
 * Re-registers a device that already opted in, without prompting. Expo push tokens can change
 * after reinstalling or updating the app, which would silently stop deliveries.
 */
export async function refreshStoredPushDevice(accessToken: string): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  const storedToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  if (!storedToken) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  await ensureAlertsChannel();
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: expoProjectId })).data;
  await registerPushDevice(accessToken, token, Platform.OS as PushDevicePlatform);
  if (token !== storedToken) {
    await unregisterPushDevice(accessToken, storedToken).catch(() => undefined);
    await storeToken(token);
  }
}

async function ensureAlertsChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ASTRONOMY_ALERTS_CHANNEL_ID, {
    name: 'Alertas astronômicos',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
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
