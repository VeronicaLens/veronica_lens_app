import { Linking } from 'react-native';

export function openExternalUrl(url: string): void {
  Linking.openURL(url).catch((cause: unknown) => {
    if (__DEV__) console.warn('Could not open link', cause);
  });
}

export function openSystemSettings(): void {
  Linking.openSettings().catch((cause: unknown) => {
    if (__DEV__) console.warn('Could not open system settings', cause);
  });
}
