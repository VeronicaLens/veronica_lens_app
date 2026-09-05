const REFRESH_MARGIN_MS = 60_000;
const MAX_TIMEOUT_MS = 2_147_483_647;

export function getSessionRefreshDelay(expiresAt: string, now = Date.now()): number {
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtMs)) return 0;

  return Math.min(Math.max(expiresAtMs - now - REFRESH_MARGIN_MS, 0), MAX_TIMEOUT_MS);
}
