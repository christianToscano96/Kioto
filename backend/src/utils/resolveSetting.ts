export function resolveConfiguredValue(
  dbValue?: string | null,
  envValue?: string | null,
  fallback = '',
): string {
  const trimmedDb = dbValue?.trim();
  if (trimmedDb) return trimmedDb;

  const trimmedEnv = envValue?.trim();
  if (trimmedEnv) return trimmedEnv;

  return fallback;
}

export function normalizeEmailAddress(value?: string | null): string {
  return value?.trim().toLowerCase() || '';
}

export function isConfiguredSecret(value?: string | null): boolean {
  return Boolean(value?.trim());
}
