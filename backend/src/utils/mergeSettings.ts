import { isConfiguredSecret, normalizeEmailAddress } from './resolveSetting';

export const CONFIGURED_SECRET_PLACEHOLDER = '__CONFIGURED__';

export function maskConfiguredSecret(value?: string | null): string {
  return isConfiguredSecret(value) ? CONFIGURED_SECRET_PLACEHOLDER : '';
}

export function resolveIncomingSecret(
  incoming: string | undefined,
  existing?: string | null,
): string | undefined {
  const trimmed = incoming?.trim();
  if (!trimmed || trimmed === CONFIGURED_SECRET_PLACEHOLDER) {
    return existing?.trim() || undefined;
  }
  return trimmed;
}

export function resolveIncomingEmail(
  incoming: string | undefined,
): string | undefined {
  const trimmed = incoming?.trim();
  if (!trimmed) {
    return undefined;
  }
  return normalizeEmailAddress(trimmed);
}

interface EmailSettingsInput {
  user?: string;
  pass?: string;
  from?: string;
}

interface GalioSettingsInput {
  apiKey?: string;
  clientId?: string;
  sandbox?: boolean;
}

interface SecuritySettingsInput {
  twoFactor?: boolean;
  apiKey?: string;
}

interface SettingsInput {
  store?: Record<string, unknown>;
  email?: EmailSettingsInput;
  payments?: {
    galio?: GalioSettingsInput;
  };
  notifications?: Record<string, unknown>;
  appearance?: Record<string, unknown>;
  security?: SecuritySettingsInput;
  social?: Record<string, unknown>;
  policies?: Record<string, unknown>;
}

function mergeNestedRecord(
  target: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!incoming) {
    return target ?? {};
  }
  return { ...(target ?? {}), ...incoming };
}

export function mergeSettingsUpdate(
  existingDoc: Record<string, any>,
  incoming: SettingsInput,
): void {
  if (incoming.store) {
    existingDoc.store = mergeNestedRecord(existingDoc.store, incoming.store);
    if (incoming.store.shipping) {
      existingDoc.store.shipping = mergeNestedRecord(
        existingDoc.store.shipping as Record<string, unknown>,
        incoming.store.shipping as Record<string, unknown>,
      );
    }
  }

  if (incoming.email) {
    if (!existingDoc.email) {
      existingDoc.email = {};
    }

    const resolvedPass = resolveIncomingSecret(incoming.email.pass, existingDoc.email.pass);
    if (resolvedPass) {
      existingDoc.email.pass = resolvedPass;
    } else if (incoming.email.pass !== undefined) {
      existingDoc.email.pass = undefined;
    }

    const resolvedFrom = resolveIncomingEmail(incoming.email.from);
    if (resolvedFrom) {
      existingDoc.email.from = resolvedFrom;
    } else if (incoming.email.from !== undefined) {
      existingDoc.email.from = undefined;
    }

    const resolvedUser = resolveIncomingEmail(incoming.email.user);
    if (resolvedUser) {
      existingDoc.email.user = resolvedUser;
    } else if (incoming.email.user !== undefined) {
      existingDoc.email.user = undefined;
    }
  }

  if (incoming.payments?.galio) {
    if (!existingDoc.payments) {
      existingDoc.payments = {};
    }
    if (!existingDoc.payments.galio) {
      existingDoc.payments.galio = {};
    }

    const resolvedApiKey = resolveIncomingSecret(
      incoming.payments.galio.apiKey,
      existingDoc.payments.galio.apiKey,
    );
    if (resolvedApiKey) {
      existingDoc.payments.galio.apiKey = resolvedApiKey;
    } else if (incoming.payments.galio.apiKey !== undefined) {
      existingDoc.payments.galio.apiKey = undefined;
    }

    const resolvedClientId = incoming.payments.galio.clientId?.trim();
    if (resolvedClientId) {
      existingDoc.payments.galio.clientId = resolvedClientId;
    } else if (incoming.payments.galio.clientId !== undefined) {
      existingDoc.payments.galio.clientId = undefined;
    }

    if (typeof incoming.payments.galio.sandbox === 'boolean') {
      existingDoc.payments.galio.sandbox = incoming.payments.galio.sandbox;
    }
  }

  if (incoming.notifications) {
    existingDoc.notifications = mergeNestedRecord(existingDoc.notifications, incoming.notifications);
  }

  if (incoming.appearance) {
    existingDoc.appearance = mergeNestedRecord(existingDoc.appearance, incoming.appearance);
  }

  if (incoming.security) {
    if (!existingDoc.security) {
      existingDoc.security = {};
    }

    const resolvedApiKey = resolveIncomingSecret(
      incoming.security.apiKey,
      existingDoc.security.apiKey,
    );
    if (resolvedApiKey) {
      existingDoc.security.apiKey = resolvedApiKey;
    } else if (incoming.security.apiKey !== undefined) {
      existingDoc.security.apiKey = undefined;
    }

    if (typeof incoming.security.twoFactor === 'boolean') {
      existingDoc.security.twoFactor = incoming.security.twoFactor;
    }
  }

  if (incoming.social) {
    existingDoc.social = mergeNestedRecord(existingDoc.social, incoming.social);
  }

  if (incoming.policies) {
    existingDoc.policies = mergeNestedRecord(existingDoc.policies, incoming.policies);
  }
}

export function maskSettingsSecrets(settings: Record<string, any>): Record<string, any> {
  const masked = { ...settings };

  if (masked.email) {
    masked.email = {
      ...masked.email,
      pass: maskConfiguredSecret(masked.email.pass),
    };
  }

  if (masked.payments?.galio) {
    masked.payments = {
      ...masked.payments,
      galio: {
        ...masked.payments.galio,
        apiKey: maskConfiguredSecret(masked.payments.galio.apiKey),
      },
    };
  }

  if (masked.security) {
    masked.security = {
      ...masked.security,
      apiKey: maskConfiguredSecret(masked.security.apiKey),
    };
  }

  return masked;
}
