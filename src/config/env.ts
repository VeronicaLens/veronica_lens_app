export interface PublicEnvironment {
  apiUrl: string;
}

type PublicEnvSource = Record<string, string | undefined>;

function required(source: PublicEnvSource, key: string): string {
  const value = source[key]?.trim();

  if (!value) {
    throw new Error(`Missing public environment variable: ${key}`);
  }

  return value;
}

export function parsePublicEnvironment(source: PublicEnvSource): PublicEnvironment {
  return {
    apiUrl: required(source, 'EXPO_PUBLIC_API_URL'),
  };
}

let cachedEnvironment: PublicEnvironment | undefined;

export function getPublicEnvironment(): PublicEnvironment {
  cachedEnvironment ??= parsePublicEnvironment(process.env);
  return cachedEnvironment;
}
