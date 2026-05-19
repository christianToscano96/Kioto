import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import crypto from 'crypto';
import Cart from '../models/Cart';
import { validate } from '../middleware/validation';
import { addToCartSchema, updateCartItemSchema, removeCartItemSchema } from '../schemas/cart';
import { getOrCreateCart, addToCart, updateCartItem, removeFromCart, clearCart, calculateCartTotal, markCartAsConverted } from '../utils/cart';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

// Helper to get session ID from request
const getSessionId = (req: Request): string => {
  return req.cookies?.sessionId || (req.headers['x-session-id'] as string) || crypto.randomUUID();
};

// Transform cart items to match frontend expected structure
const transformCartItems = (items: any[]) => {
  return items.map(item => {
    const productId = item.productId;
    const populatedProduct = typeof productId === 'object' ? productId : null;
    
    return {
      _id: item._id?.toString(),
      productId: populatedProduct ? populatedProduct._id?.toString() : productId?.toString(),
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
      product: populatedProduct ? {
        _id: populatedProduct._id?.toString(),
        name: populatedProduct.name,
        price: populatedProduct.price,
        images: populatedProduct.images || [],
        description: populatedProduct.description
      } : undefined
    };
  });
};

// GET /api/cart - Get current cart
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await getOrCreateCart(sessionId);

    // Populate product details for cart items
    await cart.populate('items.productId', 'name price images description');

    const items = transformCartItems(cart.items);
    const total = calculateCartTotal(items as any);

    res.status(200).json({
      cart: {
        _id: cart._id?.toString(),
        sessionId: cart.sessionId,
        items,
        total,
        itemCount: items.reduce((acc: number, item: any) => acc + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

// POST /api/cart/items - Add item to cart
router.post('/items', validate(addToCartSchema), async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const { productId, quantity, size, color } = req.body;
    
    const cart = await addToCart(
      sessionId,
      new Types.ObjectId(productId),
      quantity,
      size,
      color
    );

    // Set session ID cookie if not already set
    if (!req.cookies?.sessionId) {
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // Use 'none' for cross-origin in production, 'lax' for development
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    await cart.populate('items.productId', 'name price images description');
    const items = transformCartItems(cart.items);
    const total = calculateCartTotal(items as any);

    res.status(200).json({
      cart: {
        _id: cart._id?.toString(),
        sessionId: cart.sessionId,
        items,
        total,
        itemCount: items.reduce((acc: number, item: any) => acc + item.quantity, 0),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes('not found') ? 404 : 400;
      console.warn('addToCart rejected:', {
        message: error.message,
        productId: req.body.productId,
        quantity: req.body.quantity,
        size: req.body.size,
        color: req.body.color,
      });
      res.status(status).json({ error: error.message });
      return;
    }
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/items/:itemId - Update cart item quantity
router.put('/items/:itemId', validate(updateCartItemSchema), async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await updateCartItem(
      sessionId,
      new Types.ObjectId(itemId),
      quantity
    );

    await cart.populate('items.productId', 'name price images description');
    const items = transformCartItems(cart.items);
    const total = calculateCartTotal(items as any);

    res.status(200).json({
      cart: {
        _id: cart._id?.toString(),
        sessionId: cart.sessionId,
        items,
        total,
        itemCount: items.reduce((acc: number, item: any) => acc + item.quantity, 0),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cart not found') {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }
    if (error instanceof Error && error.message === 'Item not found in cart') {
      res.status(404).json({ error: 'Item not found in cart' });
      return;
    }
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE /api/cart/items/:itemId - Remove item from cart
router.delete('/items/:itemId', validate(removeCartItemSchema), async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    const { itemId } = req.params;

    const cart = await removeFromCart(sessionId, new Types.ObjectId(itemId));

    await cart.populate('items.productId', 'name price images description');
    const items = transformCartItems(cart.items);
    const total = calculateCartTotal(items as any);

    res.status(200).json({
      cart: {
        _id: cart._id?.toString(),
        sessionId: cart.sessionId,
        items,
        total,
        itemCount: items.reduce((acc: number, item: any) => acc + item.quantity, 0),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cart not found') {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// DELETE /api/cart - Clear cart
router.delete('/', async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionId(req);
    await clearCart(sessionId);

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// GET /api/cart/stats - Get cart conversion stats (admin only)
router.get('/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const totalCarts = await Cart.countDocuments();
    const abandonedCarts = await Cart.countDocuments({ converted: false });
    const convertedCarts = await Cart.countDocuments({ converted: true });

    res.json({
      totalCarts,
      abandonedCarts,
      convertedCarts,
      conversionRate: totalCarts > 0 ? ((convertedCarts / totalCarts) * 100).toFixed(2) : 0,
    });
  } catch (error) {
    console.error('Cart stats error:', error);
    res.status(500).json({ error: 'Failed to get cart stats' });
  }
});

export default router;