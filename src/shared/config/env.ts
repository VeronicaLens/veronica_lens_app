export interface PublicEnvironment {
  apiUrl: string;
  googleWebClientId: string | null;
}

type PublicEnvSource = Record<string, string | undefined>;

function required(source: PublicEnvSource, key: string): string {
  const value = source[key]?.trim();

  if (!value) {
    throw new Error(`Missing public environment variable: ${key}`);
  }

  return value;
}

function optional(source: PublicEnvSource, key: string): string | null {
  return source[key]?.trim() || null;
}

export function parsePublicEnvironment(source: PublicEnvSource): PublicEnvironment {
  return {
    apiUrl: required(source, 'EXPO_PUBLIC_API_URL'),
    googleWebClientId: optional(source, 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  };
}

let cachedEnvironment: PublicEnvironment | undefined;

export function getPublicEnvironment(): PublicEnvironment {
  cachedEnvironment ??= parsePublicEnvironment(process.env);
  return cachedEnvironment;
}
