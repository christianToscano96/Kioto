import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Stripe from 'stripe';
import { validate } from '../middleware/validation';
import { createCheckoutSchema } from '../schemas/checkout';
import { getOrCreateCart, calculateCartTotal, calculateShipping, markCartAsConverted } from '../utils/cart';
import Cart from '../models/Cart';
import Order from '../models/Order';
import { assertStockAvailable, deductStockForItems } from '../utils/stock';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '../services/email';
import { createPaymentLink } from '../services/galio';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Helper to get session ID from request
const getSessionId = (req: Request): string => {
  return req.cookies?.sessionId || (req.headers['x-session-id'] as string) || crypto.randomUUID();
};

// POST /api/checkout - Create checkout session (fake mode - no Stripe)
router.post('/', validate(createCheckoutSchema), async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await getOrCreateCart(sessionId);

    // Check if cart has items
    if (cart.items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    // Populate product details
    await cart.populate('items.productId', 'name images stock variants');

    // Check stock availability using the same variant/color rules as cart and webhooks
    for (const item of cart.items) {
      const product = item.productId as any;
      try {
        assertStockAvailable(product, item.quantity, {
          size: (item as any).size,
          color: (item as any).color,
        });
      } catch (stockError) {
        res.status(400).json({
          error: stockError instanceof Error
            ? `${product.name}: ${stockError.message}`
            : `Insufficient stock for ${product.name}`,
        });
        return;
      }
    }

    const subtotal = calculateCartTotal(cart.items);
    const shipping = calculateShipping(req.body.shippingDetails?.address?.postal_code || '');
    const total = subtotal + shipping;

// Fake checkout: Create order directly without Stripe (no transactions for standalone MongoDB)
    const order = await Order.create({
      sessionId,
      items: cart.items.map(item => ({
        productId: (item.productId as any)._id || item.productId,
        quantity: item.quantity,
        price: item.price,
        size: (item as any).size,
        color: (item as any).color,
      })),
      subtotal,
      shipping,
      total,
      status: 'pending',
      shippingDetails: req.body.shippingDetails,
    });

// Create notification for admin
    const { notifyNewOrder } = await import('../utils/notifications');
    notifyNewOrder(order._id.toString()).catch(console.error);

    // Stock is deducted only when payment succeeds (via webhook)
    // This ensures stock is NOT reduced if payment is rejected/fails

    // Mark cart as converted (customer initiated checkout)
    await markCartAsConverted(sessionId);

    // Create GalioPay payment link (optimized)
    let paymentUrl = null;
    try {
      const galioItems = [
        // Product items
        ...cart.items.map(item => ({
          title: (item.productId as any)?.name || 'Product',
          quantity: item.quantity,
          unitPrice: item.price,
          currencyId: 'ARS',
        })),
        // Shipping as separate line item (only if > 0)
        ...(shipping > 0 ? [{
          title: 'Envío',
          quantity: 1,
          unitPrice: shipping,
          currencyId: 'ARS',
        }] : []),
      ];

      // Run GalioPay creation
      const galioLink = await createPaymentLink({
        items: galioItems,
        referenceId: order._id.toString(),
        backUrl: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?orderId=${order._id}`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/cancel`,
        },
        notificationUrl: `${process.env.PUBLIC_API_URL || 'http://localhost:4000'}/api/webhooks/galio`,
        sandbox: process.env.GALIO_SANDBOX === 'true',
      });

      // Save GalioPay payment ID to order
      order.galioPaymentId = galioLink.url;
      paymentUrl = galioLink.url;
      await order.save();
    } catch (galioError) {
      console.error('GalioPay error creating payment link:', galioError);
      // Fallback: create placeholder paymentUrl so user can complete payment manually
      // This ensures the order flow doesn't break if GalioPay API is down
      paymentUrl = `https://pay.galio.app/pay/${order._id}`;
    }

// Send order confirmation email (async, don't wait)
     sendOrderConfirmationEmail(order, (order._id as any).toString())
       .then(() => console.log(`[EMAIL] Order confirmation sent for ${order._id}`))
       .catch((err) => console.error(`[EMAIL-ERROR] Order confirmation failed for ${order._id}:`, err));
     sendAdminNotificationEmail(order, (order._id as any).toString(), order.shippingDetails?.name || 'Cliente')
       .then(() => console.log(`[EMAIL] Admin notification sent for ${order._id}`))
       .catch((err) => console.error(`[EMAIL-ERROR] Admin notification failed for ${order._id}:`, err));

    res.status(200).json({
      orderId: order._id,
      sessionId: `fake_session_${order._id}`,
      success: true,
      message: 'Order created successfully',
      shipping,
      paymentUrl,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/checkout/webhook - Handle Stripe webhook
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const stripeSession = event.data.object as Stripe.Checkout.Session;

    try {
      // Get the cart from metadata
      const sessionId = stripeSession.metadata?.sessionId;

      if (!sessionId) {
        throw new Error('No session ID in metadata');
      }

      // Get cart directly (don't create new)
      const cart = await Cart.findOne({ sessionId });

      if (!cart || cart.items.length === 0) {
        console.error(`No cart found for session ${sessionId}`);
        res.json({ received: true });
        return;
      }

// Check stock availability before creating order
       await cart.populate('items.productId', 'name stock variants');
       for (const item of cart.items) {
         const product = item.productId as any;
         try {
           assertStockAvailable(product, item.quantity, {
             size: (item as any).size,
             color: (item as any).color,
           });
         } catch (stockError) {
           console.error(`Insufficient stock for ${product.name} (ID: ${product._id}):`, stockError);
           res.json({ received: true });
           return;
         }
       }

      const total = calculateCartTotal(cart.items);
      const subtotal = total; // Use cart total as subtotal
      const shipping = Number(stripeSession.metadata?.shipping) || 0;

      // Extract shipping details from Stripe session
      const customerDetails = stripeSession.customer_details;
      const shippingDetails = {
        name: customerDetails?.name || '',
        email: customerDetails?.email || '',
        address: {
          line1: customerDetails?.address?.line1 || '',
          line2: customerDetails?.address?.line2 || '',
          city: customerDetails?.address?.city || '',
          state: customerDetails?.address?.state || '',
          postal_code: customerDetails?.address?.postal_code || '',
          country: customerDetails?.address?.country || '',
        },
      };

      const paymentIntentId = stripeSession.payment_intent as string;
      if (paymentIntentId) {
        const existingOrder = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
        if (existingOrder) {
          res.json({ received: true });
          return;
        }
      }

      // Create order (no transactions for standalone MongoDB)
      const order = await Order.create({
        sessionId,
        items: cart.items.map(item => ({
          productId: (item.productId as any)._id || item.productId,
          quantity: item.quantity,
          price: item.price,
          size: (item as any).size,
          color: (item as any).color,
        })),
        subtotal,
        shipping,
        total: subtotal + shipping,
        status: 'paid',
        stripePaymentIntentId: paymentIntentId,
        shippingDetails,
      });

// Deduct stock atomically after payment is confirmed
      await deductStockForItems(cart.items as any);

      // Mark cart as converted
      await markCartAsConverted(sessionId);

      console.log(`Order ${order._id} created from session ${stripeSession.id}`);

      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail(order, (order._id as any).toString());
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    } catch (error) {
      console.error('Error creating order from webhook:', error);
    }
  } else if (event.type === 'checkout.session.expired') {
    // Handle expired sessions if needed
    console.log(`Session expired: ${event.data.object.id}`);
  }

  res.json({ received: true });
});

// Async GalioPay payment link creation (doesn't block checkout response)
async function createGalioPayLinkAsync(orderId: string, items: any[]) {
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    const galioItems = items.map((item: any) => ({
      title: (item.productId as any)?.name || 'Product',
      quantity: item.quantity,
      unitPrice: item.price,
      currencyId: 'ARS',
    }));

    const galioLink = await createPaymentLink({
      items: galioItems,
      referenceId: orderId,
      backUrl: {
        success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?orderId=${orderId}`,
        failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/cancel`,
      },
      notificationUrl: `${process.env.PUBLIC_API_URL || 'http://localhost:4000'}/api/webhooks/galio`,
      sandbox: process.env.GALIO_SANDBOX === 'true',
    });

    // Update order with GalioPay link
    order.galioPaymentId = galioLink.url;
    await order.save();
  } catch (error) {
    console.error('Async GalioPay error:', error);
  }
}

export default router;