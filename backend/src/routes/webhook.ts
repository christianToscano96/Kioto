import { Router } from 'express';
import mongoose from 'mongoose';
import Order, { type IOrder } from '../models/Order';
import { getPayment } from '../services/galio';
import {
  getPaymentFailureReason,
  isGalioPaymentApproved,
  isGalioPaymentFailed,
  normalizeGalioStatus,
} from '../utils/galioPaymentStatus';
import {
  markOrderAsCancelled,
  markOrderAsFailed,
  markOrderAsPaid,
} from '../utils/orderPayment';

const router = Router();

function buildOrderQuery(referenceId?: string, paymentId?: string) {
  const conditions: Record<string, unknown>[] = [];

  if (referenceId && mongoose.Types.ObjectId.isValid(referenceId)) {
    conditions.push({ _id: referenceId });
  }

  if (paymentId) {
    conditions.push({ galioPaymentId: paymentId });
  }

  return conditions.length > 0 ? { $or: conditions } : null;
}

async function processApprovedPayment(order: IOrder, paymentId?: string) {
  const result = await markOrderAsPaid(order, { galioPaymentId: paymentId });
  return { success: true, alreadyProcessed: result.alreadyProcessed };
}

async function processFailedPayment(order: IOrder, status?: string) {
  const reason = getPaymentFailureReason(status);
  await markOrderAsFailed(order, { reason });
  return { success: true, status: 'failed', reason };
}

/**
 * Webhook endpoint for GalioPay notifications
 * POST /api/webhooks/galio
 */
router.post('/galio', async (req, res) => {
  try {
    const { paymentId, referenceId, status } = req.body;

    if (!referenceId && !paymentId) {
      return res.status(400).json({ error: 'Missing payment reference' });
    }

    const orderQuery = buildOrderQuery(referenceId, paymentId);
    if (!orderQuery) {
      return res.status(400).json({ error: 'Invalid payment reference' });
    }

    const order = await Order.findOne(orderQuery);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (paymentId) {
      order.galioPaymentId = paymentId;
    }

    const normalizedStatus = normalizeGalioStatus(status);

    if (isGalioPaymentApproved(normalizedStatus)) {
      const result = await processApprovedPayment(order, paymentId);
      return res.json(result);
    }

    if (isGalioPaymentFailed(normalizedStatus)) {
      const result = await processFailedPayment(order, normalizedStatus);
      return res.json(result);
    }

    if (paymentId) {
      const payment = await getPayment(paymentId);
      order.galioPaymentId = payment.id;

      if (isGalioPaymentApproved(payment.status)) {
        const result = await processApprovedPayment(order, payment.id);
        return res.json(result);
      }

      if (payment.status === 'refunded') {
        await markOrderAsCancelled(order, { restoreStock: true });
        return res.json({ success: true, status: 'cancelled' });
      }

      if (isGalioPaymentFailed(payment.status)) {
        const result = await processFailedPayment(order, payment.status);
        return res.json(result);
      }
    }

    if (paymentId) {
      await order.save();
    }

    res.json({ success: true, status: 'pending' });
  } catch (error) {
    console.error('Galio webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
