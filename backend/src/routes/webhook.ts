import { Router } from 'express';
import mongoose from 'mongoose';
import Order, { type IOrder } from '../models/Order';
import { getPayment } from '../services/galio';
import {
  isGalioPaymentApproved,
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

    if (isGalioPaymentApproved(status)) {
      const result = await processApprovedPayment(order, paymentId);
      return res.json(result);
    }

    if (status === 'rejected' || status === 'failed' || status === 'cancelled') {
      await markOrderAsFailed(order);
      return res.json({ success: true, status: 'failed' });
    }

    if (paymentId) {
      const payment = await getPayment(paymentId);

      if (isGalioPaymentApproved(payment.status)) {
        const result = await processApprovedPayment(order, paymentId);
        return res.json(result);
      }

      if (payment.status === 'refunded') {
        await markOrderAsCancelled(order, { restoreStock: true });
        return res.json({ success: true, status: 'cancelled' });
      }

      if (payment.status === 'rejected' || payment.status === 'failed') {
        await markOrderAsFailed(order);
        return res.json({ success: true, status: 'failed' });
      }
    }

    res.json({ success: true, status: 'pending' });
  } catch (error) {
    console.error('Galio webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
