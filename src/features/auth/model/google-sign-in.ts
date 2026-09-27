import { getPublicEnvironment } from '../../../shared/config/index.ts';

let configured = false;

async function loadGoogleSignin() {
  return (await import('@react-native-google-signin/google-signin')).GoogleSignin;
}

async function configureOnce(): Promise<void> {
  if (configured) return;
  const { googleWebClientId } = getPublicEnvironment();
  if (!googleWebClientId) {
    throw new Error('Missing public environment variable: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }

  const GoogleSignin = await loadGoogleSignin();
  GoogleSignin.configure({ webClientId: googleWebClientId, offlineAccess: false });
  configured = true;
}

/** Signs in with the native Google account picker and returns the Google ID token. */
export async function getGoogleIdToken(): Promise<string> {
  await configureOnce();
  const GoogleSignin = await loadGoogleSignin();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken;
  if (!idToken) {
    throw new Error('Google did not return an ID token');
  }
  return idToken;
}
