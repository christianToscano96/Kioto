import Order from '../models/Order';
import { markOrderAsFailed } from '../utils/orderPayment';
import { getPendingOrderTtlMinutes } from '../utils/pendingOrderTtl';

export { GALIO_PAYMENT_TTL_MINUTES } from '../utils/pendingOrderTtl';

const DEFAULT_SWEEP_MS = 2 * 60 * 1000;

export async function expireStalePendingOrders(): Promise<number> {
  const ttlMinutes = getPendingOrderTtlMinutes();
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);

  const staleOrders = await Order.find({
    status: 'pending',
    paymentMethod: 'galio',
    createdAt: { $lt: cutoff },
  });

  let expiredCount = 0;

  for (const order of staleOrders) {
    const updated = await markOrderAsFailed(order, { reason: 'expired' });
    if (updated) expiredCount += 1;
  }

  return expiredCount;
}

export function startPendingOrderExpiryJob(): NodeJS.Timeout {
  const sweepMs = Number(process.env.PENDING_ORDER_SWEEP_MS) || DEFAULT_SWEEP_MS;

  const run = () => {
    expireStalePendingOrders()
      .then((count) => {
        if (count > 0) {
          console.log(`[EXPIRE-ORDERS] Marked ${count} pending Galio orders as expired`);
        }
      })
      .catch((error) => {
        console.error('[EXPIRE-ORDERS] Sweep failed:', error);
      });
  };

  run();
  return setInterval(run, sweepMs);
}
