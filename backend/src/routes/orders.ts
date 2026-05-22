import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth';
import Order from '../models/Order';
import Product from '../models/Product';
import { resendOrderConfirmationEmail } from '../services/email';
import { getPayment, refundPayment } from '../services/galio';
import { assertStockAvailable, deductStockForItems } from '../utils/stock';

const router = Router();

router.use(authenticate, adminOnly);

// Get all orders (admin only) - supports date filtering
router.get('/', async (req, res) => {
  try {
    const { days, from, to } = req.query;
    const query: Record<string, unknown> = {};

    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(days));
      query.createdAt = { $gte: daysAgo };
    } else if (from || to) {
      const dateQuery: Record<string, Date> = {};
      if (from) dateQuery.$gte = new Date(from as string);
      if (to) {
        const endDate = new Date(to as string);
        endDate.setHours(23, 59, 59, 999);
        dateQuery.$lte = endDate;
      }
      if (Object.keys(dateQuery).length > 0) {
        query.createdAt = dateQuery;
      }
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    // Try to find by full ID or partial ID (last 8 chars)
    let order;
    if (req.params.id.length <= 8) {
      // Search by partial ID on the server instead of loading every order into Node
      const [partialMatch] = await Order.aggregate([
        { $addFields: { idString: { $toString: '$_id' } } },
        { $match: { idString: { $regex: `${req.params.id}$` } } },
        { $limit: 1 },
      ]);
      order = partialMatch;
    } else {
      order = await Order.findById(req.params.id)
        .populate('items.productId', 'name price')
        .lean();
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'failed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Resend order confirmation email
router.post('/:id/resend-email', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId', 'name price');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await resendOrderConfirmationEmail(order, (order._id as any).toString());
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Resend email error:', error);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

// Get GalioPay payment status
router.get('/:id/galio-payment', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.galioPaymentId) {
      return res.status(400).json({ error: 'No GalioPay payment ID' });
    }

    const payment = await getPayment(order.galioPaymentId);
    res.json(payment);
  } catch (error) {
    console.error('GalioPay payment fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch GalioPay payment' });
  }
});

// Refund GalioPay payment
router.post('/:id/refund-galio', async (req, res) => {
  try {
    const { reason, refundType } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.galioPaymentId) {
      return res.status(400).json({ error: 'No GalioPay payment ID' });
    }

    const result = await refundPayment(order.galioPaymentId, { reason, refundType });
    
    if (result.success) {
      order.status = 'cancelled';
      await order.save();
    }

    res.json(result);
  } catch (error) {
    console.error('GalioPay refund error:', error);
    res.status(500).json({ error: 'Failed to refund GalioPay payment' });
  }
});

// Create manual order (admin only)
router.post('/manual', async (req, res) => {
  try {
    const { customerEmail, customerName, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const productIds = items.map((item: any) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productById = new Map(products.map((product) => [product._id.toString(), product]));

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      try {
        const resolvedStock = assertStockAvailable(product, item.quantity, {
          size: item.size,
          color: item.color,
        });

        orderItems.push({
          productId: product._id,
          quantity: item.quantity,
          price: product.price,
          size: resolvedStock.resolvedSize,
          color: resolvedStock.resolvedColor,
        });
        total += product.price * item.quantity;
      } catch (stockError) {
        return res.status(400).json({
          error: stockError instanceof Error
            ? `${product.name}: ${stockError.message}`
            : `Insufficient stock for ${product.name}`,
        });
      }
    }

    await deductStockForItems(orderItems as any);

    const order = await Order.create({
      items: orderItems,
      total,
      status: 'paid',
      shippingDetails: {
        name: customerName,
        email: customerEmail,
        address: {},
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Manual order error:', error);
    res.status(500).json({ error: 'Failed to create manual order' });
  }
});

export default router;