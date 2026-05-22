export type PaymentFailureReason = 'expired' | 'rejected' | 'failed' | 'cancelled';

const APPROVED_STATUSES = new Set(['approved', 'ok', 'paid', 'success', 'completed']);

const EXPIRED_STATUSES = new Set([
  'expired',
  'timeout',
  'timed_out',
  'time_out',
  'overdue',
  'payment_expired',
  'link_expired',
]);

const FAILED_STATUSES = new Set([
  ...EXPIRED_STATUSES,
  'failed',
  'rejected',
  'cancelled',
  'declined',
  'error',
]);

export function normalizeGalioStatus(status?: string): string {
  return (status ?? '').toLowerCase().trim();
}

export function isGalioPaymentApproved(status?: string): boolean {
  return APPROVED_STATUSES.has(normalizeGalioStatus(status));
}

export function isGalioPaymentFailed(status?: string): boolean {
  return FAILED_STATUSES.has(normalizeGalioStatus(status));
}

export function isGalioPaymentExpired(status?: string): boolean {
  return EXPIRED_STATUSES.has(normalizeGalioStatus(status));
}

export function getPaymentFailureReason(status?: string): PaymentFailureReason {
  const normalized = normalizeGalioStatus(status);

  if (EXPIRED_STATUSES.has(normalized)) {
    return 'expired';
  }
  if (normalized === 'cancelled') {
    return 'cancelled';
  }
  if (normalized === 'rejected' || normalized === 'declined') {
    return 'rejected';
  }
  return 'failed';
}
