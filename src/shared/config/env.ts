export interface PublicEnvironment {
  apiUrl: string;
  googleWebClientId: string | null;
  privacyPolicyUrl: string | null;
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

function optionalHttpsUrl(source: PublicEnvSource, key: string): string | null {
  const value = optional(source, key);
  if (value === null) return null;
  if (!/^https:\/\/\S+$/i.test(value)) {
    throw new Error(`Public environment variable must be an https URL: ${key}`);
  }
  return value;
}

export function parsePublicEnvironment(source: PublicEnvSource): PublicEnvironment {
  return {
    apiUrl: required(source, 'EXPO_PUBLIC_API_URL'),
    googleWebClientId: optional(source, 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
    privacyPolicyUrl: optionalHttpsUrl(source, 'EXPO_PUBLIC_PRIVACY_POLICY_URL'),
  };
}

let cachedEnvironment: PublicEnvironment | undefined;

export function getPublicEnvironment(): PublicEnvironment {
  cachedEnvironment ??= parsePublicEnvironment(process.env);
  return cachedEnvironment;
}
