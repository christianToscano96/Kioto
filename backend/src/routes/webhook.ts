import { Router } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import { getPayment } from '../services/galio';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '../services/email';
import { deductStockForItems } from '../utils/stock';

const router = Router();

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

    // Convert referenceId to ObjectId if valid
    let orderQuery: any = {};
    if (referenceId && mongoose.Types.ObjectId.isValid(referenceId)) {
      orderQuery = { _id: referenceId };
    } else if (paymentId) {
      orderQuery = { galioPaymentId: paymentId };
    }

    if (Object.keys(orderQuery).length === 0) {
      return res.status(400).json({ error: 'Invalid payment reference' });
    }

    const order = await Order.findOne(orderQuery);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Mark order as paid and deduct stock
    // GalioPay sends 'approved' or 'ok' for successful payments
    if (status === 'approved' || status === 'ok') {
      if (order.status === 'paid') {
        return res.json({ success: true, alreadyProcessed: true });
      }

      await deductStockForItems(order.items as any);
      order.status = 'paid';
      await order.save();
      
      // Send order confirmation emails
      sendOrderConfirmationEmail(order, order._id.toString())
        .then(() => console.log(`[EMAIL] Customer confirmation sent for order ${order._id}`))
        .catch((err) => console.error(`[EMAIL-ERROR] Customer confirmation failed for order ${order._id}:`, err));
      sendAdminNotificationEmail(order, order._id.toString(), order.shippingDetails?.name || 'Cliente')
        .then(() => console.log(`[EMAIL] Admin notification sent for order ${order._id}`))
        .catch((err) => console.error(`[EMAIL-ERROR] Admin notification failed for order ${order._id}:`, err));
      
      return res.json({ success: true });
    }

    // Otherwise verify with GalioPay API
    if (paymentId) {
      const payment = await getPayment(paymentId);
      // GalioPay API returns 'approved' for successful payments
      if ((payment.status === 'approved' || payment.status === 'ok') && order.status === 'pending') {
        await deductStockForItems(order.items as any);
        order.status = 'paid';
        await order.save();
        
// Send order confirmation emails
         sendOrderConfirmationEmail(order, order._id.toString())
           .then(() => console.log(`[EMAIL] Customer confirmation sent for order ${order._id}`))
           .catch((err) => console.error(`[EMAIL-ERROR] Customer confirmation failed for order ${order._id}:`, err));
         sendAdminNotificationEmail(order, order._id.toString(), order.shippingDetails?.name || 'Cliente')
           .then(() => console.log(`[EMAIL] Admin notification sent for order ${order._id}`))
           .catch((err) => console.error(`[EMAIL-ERROR] Admin notification failed for order ${order._id}:`, err));
      } else if (payment.status === 'refunded') {
        order.status = 'cancelled';
        await order.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Galio webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});


export default router;
