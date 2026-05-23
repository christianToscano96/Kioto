import type { IOrder } from '../models/Order';
import {
  sendAdminNotificationEmail,
  sendOrderConfirmationEmailIfNeeded,
  sendOrderShippedEmailIfNeeded,
} from '../services/email';
import { deductStockForItems, restoreStockForItems } from './stock';
import type { PaymentFailureReason } from './galioPaymentStatus';
import { notifyOrderPaid, notifyOrderPaymentFailed } from './notifications';

export { isGalioPaymentApproved } from './galioPaymentStatus';

export async function markOrderAsPaid(
  order: IOrder,
  options?: { galioPaymentId?: string; skipEmails?: boolean },
): Promise<{ alreadyProcessed: boolean }> {
  const alreadyProcessed = order.status === 'paid';
  const orderId = order._id.toString();

  if (!alreadyProcessed) {
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

    notifyOrderPaid(orderId).catch(console.error);

    if (!options?.skipEmails) {
      sendAdminNotificationEmail(order, orderId, order.shippingDetails?.name || 'Cliente').catch((err) => {
        console.error(`[EMAIL-ERROR] Admin notification failed for order ${orderId}:`, err);
      });
    }
  }

  if (!options?.skipEmails) {
    await sendOrderConfirmationEmailIfNeeded(orderId);
  }

  return { alreadyProcessed };
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

export async function notifyCustomerOrderShipped(orderId: string): Promise<boolean> {
  return sendOrderShippedEmailIfNeeded(orderId);
}
