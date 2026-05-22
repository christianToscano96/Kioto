/** GalioPay payment links expire after 15 minutes by default. */
export const GALIO_PAYMENT_TTL_MINUTES = 15;
const DEFAULT_TTL_MINUTES = GALIO_PAYMENT_TTL_MINUTES;

export function getPendingOrderTtlMinutes(): number {
  const fromMinutes = Number(process.env.PENDING_ORDER_TTL_MINUTES);
  if (Number.isFinite(fromMinutes) && fromMinutes > 0) {
    return fromMinutes;
  }

  const fromHours = Number(process.env.PENDING_ORDER_TTL_HOURS);
  if (Number.isFinite(fromHours) && fromHours > 0) {
    return fromHours * 60;
  }

  return DEFAULT_TTL_MINUTES;
}

export function getPendingOrderExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + getPendingOrderTtlMinutes() * 60 * 1000);
}

export function getPendingOrderTimeLeftMs(createdAt: Date, now = Date.now()): number {
  return Math.max(0, getPendingOrderExpiresAt(createdAt).getTime() - now);
}

export function isPendingGalioOrderActive(order: {
  status: string;
  paymentMethod?: string;
  createdAt: Date;
}): boolean {
  if (order.status !== 'pending' || order.paymentMethod !== 'galio') {
    return false;
  }

  return getPendingOrderTimeLeftMs(order.createdAt) > 0;
}
