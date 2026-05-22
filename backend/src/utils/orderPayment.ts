import type { IOrder } from '../models/Order';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '../services/email';
import { deductStockForItems, restoreStockForItems } from './stock';
import type { PaymentFailureReason } from './galioPaymentStatus';
import { notifyOrderPaid, notifyOrderPaymentFailed } from './notifications';

export { isGalioPaymentApproved } from './galioPaymentStatus';

export async function markOrderAsPaid(
  order: IOrder,
  options?: { galioPaymentId?: string; skipEmails?: boolean },
): Promise<{ alreadyProcessed: boolean }> {
  if (order.status === 'paid') {
    return { alreadyProcessed: true };
  }

  await deductStockForItems(order.items as any);
  order.status = 'paid';
  order.paymentFailureReason = undefined;

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

export async function markOrderAsFailed(
  order: IOrder,
  options?: { reason?: PaymentFailureReason; notify?: boolean },
): Promise<boolean> {
  if (order.status === 'paid' || order.status === 'cancelled') {
    return false;
  }

  const wasAlreadyFailed = order.status === 'failed';
  order.status = 'failed';
  order.paymentFailureReason = options?.reason ?? order.paymentFailureReason ?? 'failed';
  await order.save();

  if (!wasAlreadyFailed && options?.notify !== false) {
    notifyOrderPaymentFailed(order._id.toString(), order.paymentFailureReason).catch(console.error);
  }

  return !wasAlreadyFailed;
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
