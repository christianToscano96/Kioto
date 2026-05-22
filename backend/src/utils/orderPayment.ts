import type { IOrder } from '../models/Order';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '../services/email';
import { deductStockForItems, restoreStockForItems } from './stock';
import { notifyOrderPaid } from './notifications';

const APPROVED_STATUSES = new Set(['approved', 'ok', 'paid']);

export function isGalioPaymentApproved(status: string | undefined): boolean {
  return !!status && APPROVED_STATUSES.has(status.toLowerCase());
}

export async function markOrderAsPaid(
  order: IOrder,
  options?: { galioPaymentId?: string; skipEmails?: boolean },
): Promise<{ alreadyProcessed: boolean }> {
  if (order.status === 'paid') {
    return { alreadyProcessed: true };
  }

  await deductStockForItems(order.items as any);
  order.status = 'paid';

  if (options?.galioPaymentId) {
    order.galioPaymentId = options.galioPaymentId;
  }

  await order.save();

  if (order.sessionId) {
    const { markCartAsConverted } = await import('./cart');
    await markCartAsConverted(order.sessionId);
  }

  const orderId = order._id.toString();

  if (!options?.skipEmails) {
    sendOrderConfirmationEmail(order, orderId)
      .then(() => console.log(`[EMAIL] Customer confirmation sent for order ${orderId}`))
      .catch((err) => console.error(`[EMAIL-ERROR] Customer confirmation failed for order ${orderId}:`, err));
    sendAdminNotificationEmail(order, orderId, order.shippingDetails?.name || 'Cliente')
      .then(() => console.log(`[EMAIL] Admin notification sent for order ${orderId}`))
      .catch((err) => console.error(`[EMAIL-ERROR] Admin notification failed for order ${orderId}:`, err));
  }

  notifyOrderPaid(orderId).catch(console.error);

  return { alreadyProcessed: false };
}

export async function markOrderAsFailed(order: IOrder): Promise<void> {
  if (order.status === 'paid' || order.status === 'cancelled') return;
  order.status = 'failed';
  await order.save();
}

export async function markOrderAsCancelled(
  order: IOrder,
  options?: { restoreStock?: boolean },
): Promise<void> {
  if (order.status === 'cancelled') return;

  if (options?.restoreStock && order.status === 'paid') {
    await restoreStockForItems(order.items as any);
  }

  order.status = 'cancelled';
  await order.save();
}
