import { getPublicEnvironment } from '../../../shared/config/index.ts';

let configured = false;

export class GoogleSignInCancelledError extends Error {}

async function loadGoogleSignin() {
  return await import('@react-native-google-signin/google-signin');
}

async function configureOnce(): Promise<void> {
  if (configured) return;
  const { googleWebClientId } = getPublicEnvironment();
  if (!googleWebClientId) {
    throw new Error('Missing public environment variable: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }

  const { GoogleSignin } = await loadGoogleSignin();
  GoogleSignin.configure({ webClientId: googleWebClientId, offlineAccess: false });
  configured = true;
}

/** Signs in with the native Google account picker and returns the Google ID token. */
export async function getGoogleIdToken(): Promise<string> {
  await configureOnce();
  const { GoogleSignin, isErrorWithCode, statusCodes } = await loadGoogleSignin();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new Error('O Google não retornou um token de identificação.');
    }
    return idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new GoogleSignInCancelledError();
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Já existe um login do Google em andamento.');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services indisponível ou desatualizado neste aparelho.');
      }
      throw new Error(`Falha no login do Google (código ${error.code}).`);
    }
    throw error;
  }
}