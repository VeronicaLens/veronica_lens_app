export function getRecoveryAccessToken(url: string | null): string | null {
  if (!url) return null;

  try {
    const fragment = url.split('#')[1];
    if (!fragment) return null;
    const params = new URLSearchParams(fragment);
    return params.get('type') === 'recovery' ? params.get('access_token') : null;
  } catch {
    return null;
  }
}
