import Settings from '../models/Settings';
import { resolveConfiguredValue } from '../utils/resolveSetting';
import { resolveIncomingSecret } from '../utils/mergeSettings';

export interface GalioPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  referenceId: string;
  type: string;
  moneyReleaseDate: string;
  netAmount: number;
}

export interface GalioPaymentLink {
  url: string;
  proofToken: string;
  referenceId: string;
  sandbox: boolean;
}

interface GalioRuntimeConfig {
  apiKey: string;
  clientId: string;
  sandbox: boolean;
}

// Cache settings for 5 minutes
let settingsCache: GalioRuntimeConfig | null = null;
let settingsCacheTime = 0;

export function resetGalioSettingsCache() {
  settingsCache = null;
  settingsCacheTime = 0;
}

async function getGalioSettings(): Promise<GalioRuntimeConfig> {
  const now = Date.now();
  if (settingsCache && now - settingsCacheTime < 5 * 60 * 1000) {
    return settingsCache;
  }

  const settings = await Settings.findOne().select('payments.galio');

  const apiKey = resolveConfiguredValue(
    settings?.payments?.galio?.apiKey,
    process.env.GALIO_API_KEY,
  );
  const clientId = resolveConfiguredValue(
    settings?.payments?.galio?.clientId,
    process.env.GALIO_CLIENT_ID,
  );
  const sandbox =
    typeof settings?.payments?.galio?.sandbox === 'boolean'
      ? settings.payments.galio.sandbox
      : process.env.GALIO_SANDBOX === 'true';

  if (!apiKey || !clientId) {
    throw new Error('GalioPay not configured');
  }

  settingsCache = { apiKey, clientId, sandbox };
  settingsCacheTime = now;
  return settingsCache;
}

export async function getGalioSandbox(): Promise<boolean> {
  const { sandbox } = await getGalioSettings();
  return sandbox;
}

export interface GalioConnectionOverrides {
  apiKey?: string;
  clientId?: string;
  sandbox?: boolean;
}

export async function testGalioConnection(
  overrides?: GalioConnectionOverrides,
): Promise<{ ok: true; sandbox: boolean; message: string }> {
  const settings = await Settings.findOne().select('payments.galio').lean();

  const apiKey = resolveConfiguredValue(
    resolveIncomingSecret(overrides?.apiKey, settings?.payments?.galio?.apiKey),
    process.env.GALIO_API_KEY,
  );
  const clientId = resolveConfiguredValue(
    overrides?.clientId?.trim(),
    resolveConfiguredValue(settings?.payments?.galio?.clientId, process.env.GALIO_CLIENT_ID),
  );
  const sandbox =
    typeof overrides?.sandbox === 'boolean'
      ? overrides.sandbox
      : typeof settings?.payments?.galio?.sandbox === 'boolean'
        ? settings.payments.galio.sandbox
        : process.env.GALIO_SANDBOX === 'true';

  if (!apiKey || !clientId) {
    throw new Error('Faltan API Key o Client ID de GalioPay');
  }

  const response = await fetch('https://pay.galio.app/api/payments/000000000000000000000001', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-client-id': clientId,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('Credenciales de GalioPay inválidas');
  }

  if (response.status === 404 || response.ok) {
    return {
      ok: true,
      sandbox,
      message: sandbox
        ? 'Conexión verificada en modo sandbox'
        : 'Conexión verificada en modo producción',
    };
  }

  let errorMessage = `GalioPay respondió con error (${response.status})`;
  try {
    const errorData = (await response.json()) as { error?: string };
    if (errorData.error) errorMessage = errorData.error;
  } catch {
    // ignore parse errors
  }

  throw new Error(errorMessage);
}

export async function getPayment(paymentId: string): Promise<GalioPayment> {
  const { apiKey, clientId } = await getGalioSettings();

  const response = await fetch(`https://pay.galio.app/api/payments/${paymentId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-client-id': clientId,
    },
  });

  if (!response.ok) {
    const errorData = await response.json() as { error?: string };
    throw new Error(errorData.error || 'Failed to fetch payment');
  }

  return response.json() as Promise<GalioPayment>;
}

export async function refundPayment(
  paymentId: string,
  options?: { reason?: string; refundType?: 'total' | 'partial'; refundAmount?: number }
): Promise<{ success: boolean; payment: { id: string; status: string } }> {
  const { apiKey, clientId } = await getGalioSettings();

  const response = await fetch(`https://pay.galio.app/api/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-client-id': clientId,
    },
    body: JSON.stringify(options || { refundType: 'total' }),
  });

  if (!response.ok) {
    const errorData = await response.json() as { error?: string };
    throw new Error(errorData.error || 'Failed to refund payment');
  }

  return response.json() as Promise<{ success: boolean; payment: { id: string; status: string } }>;
}

export async function verifyPaymentStatus(order: any): Promise<string> {
  if (!order.galioPaymentId || order.galioPaymentId.startsWith('http')) {
    return order.status;
  }

  try {
    const payment = await getPayment(order.galioPaymentId);
    return payment.status;
  } catch (error) {
    console.error('GalioPay verification error:', error);
    return order.status;
  }
}

export async function createPaymentLink(data: {
  items: Array<{ title: string; quantity: number; unitPrice: number; currencyId: string }>;
  referenceId: string;
  backUrl?: { success?: string; failure?: string };
  notificationUrl?: string;
  sandbox?: boolean;
}): Promise<GalioPaymentLink> {
  const { apiKey, clientId } = await getGalioSettings();

  const response = await fetch('https://pay.galio.app/api/payment-links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-client-id': clientId,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json() as { error?: string };
    throw new Error(errorData.error || 'Failed to create payment link');
  }

  return response.json() as Promise<GalioPaymentLink>;
}