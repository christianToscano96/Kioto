import { Types } from 'mongoose';
import Cart, { ICart } from '../models/Cart';
import { ICartItem } from '../models/types';
import Product from '../models/Product';
import { resolveStockSelection, assertStockAvailable } from './stock';

/**
 * Get or create a cart for a session
 * If cart exists but is already converted, create a fresh one
 */
export const getOrCreateCart = async (sessionId: string): Promise<ICart> => {
  let cart = await Cart.findOne({ sessionId });

  if (!cart) {
    cart = await Cart.create({ sessionId, items: [] });
  } else if (cart.converted) {
    // Cart already purchased - create a new fresh cart
    await Cart.deleteOne({ sessionId });
    cart = await Cart.create({ sessionId, items: [] });
  }

  return cart;
};

/**
 * Add an item to the cart with stock and price validation
 */
export const addToCart = async (
  sessionId: string,
  productId: Types.ObjectId,
  quantity: number,
  size?: string,
  color?: string
): Promise<ICart> => {
  // Verify product exists and is published
  const product = await Product.findOne({ _id: productId, published: true });
  if (!product) {
    throw new Error('Product not found or not available');
  }

  const cart = await getOrCreateCart(sessionId);

  // Check existing item FIRST so we know the total quantity before validating stock
  const existingItemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId.toString() &&
      item.size === (size ?? '') &&
      item.color === (color ?? ''),
  );

  const alreadyInCart = existingItemIndex >= 0
    ? cart.items[existingItemIndex].quantity
    : 0;

  // Resolve stock BEFORE checking total so we know availableStock for the error message
  const resolvedStock = resolveStockSelection(product, { size, color });
  const totalRequested = alreadyInCart + quantity;

  if (resolvedStock.availableStock < totalRequested) {
    throw new Error(
      alreadyInCart > 0
        ? `You already have ${alreadyInCart} in your cart — only ${resolvedStock.availableStock} in stock total. Remove from cart first to change quantity.`
        : `Only ${resolvedStock.availableStock} available in stock`,
    );
  }

  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity = totalRequested;
  } else {
    cart.items.push({
      productId,
      quantity,
      price: product.price,
      size: resolvedStock.size ?? '',
      color: resolvedStock.color ?? '',
    });
  }

  return cart.save();
};

/**
 * Update a cart item quantity by cart item _id (subdocument id)
 * Falls back to productId matching for carts created before _id was added to items
 * With stock validation
 */
export const updateCartItem = async (
  sessionId: string,
  cartItemId: Types.ObjectId,
  quantity: number
): Promise<ICart> => {
  const cart = await Cart.findOne({ sessionId });

  if (!cart) {
    throw new Error('Cart not found');
  }

  const itemIndex = cart.items.findIndex(
    item => item._id?.toString() === cartItemId.toString() ||
            (item._id === undefined && item.productId.toString() === cartItemId.toString())
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  // Verify stock availability
  const product = await Product.findById(cart.items[itemIndex].productId);
  if (!product) {
    throw new Error('Product not found');
  }
  
  const itemSize = (cart.items[itemIndex] as any).size;
  const itemColor = (cart.items[itemIndex] as any).color;
  assertStockAvailable(product, quantity, { size: itemSize, color: itemColor });

  // Verify price hasn't changed
  if (product.price !== cart.items[itemIndex].price) {
    throw new Error('Price has changed. Please refresh and try again.');
  }

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  return cart.save();
};

/**
 * Remove an item from the cart by cart item _id (subdocument id)
 * Falls back to productId matching for carts created before _id was added to items
 */
export const removeFromCart = async (
  sessionId: string,
  cartItemId: Types.ObjectId
): Promise<ICart> => {
  const cart = await Cart.findOne({ sessionId });

  if (!cart) {
    throw new Error('Cart not found');
  }

  const itemIndex = cart.items.findIndex(
    item => item._id?.toString() === cartItemId.toString() ||
            (item._id === undefined && item.productId.toString() === cartItemId.toString())
  );

  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }

  cart.items.splice(itemIndex, 1);

  return cart.save();
};

/**
 * Clear the entire cart (deprecated - use markCartAsConverted)
 */
export const clearCart = async (sessionId: string): Promise<void> => {
  await Cart.findOneAndDelete({ sessionId });
};

/**
 * Mark cart as converted (customer completed checkout)
 */
export const markCartAsConverted = async (sessionId: string): Promise<void> => {
  await Cart.updateOne({ sessionId }, { $set: { converted: true } });
};

/**
 * Calculate cart total
 */
export const calculateCartTotal = (items: ICartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

/**
 * Get cart item count
 */
export const getCartItemCount = (items: ICartItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Calculate shipping cost based on postal code
 * Y4512 = Local shipping (same as store location)
 */
export const calculateShipping = (postalCode: string): number => {
  // Local shipping (same postal code as store)
  if (postalCode === 'Y4512') {
    return 0; // Envío a domicilio gratuito
  }
  
  // Default shipping rates
  const numericCode = parseInt(postalCode.replace(/\D/g, ''), 10);
  
  if (isNaN(numericCode)) {
    return 15; // Default rate for invalid codes
  }
  
  // Zone-based shipping rates
  if (numericCode >= 1000 && numericCode <= 2000) {
    return 5; // Capital
  } else if (numericCode >= 3000 && numericCode <= 5000) {
    return 10; // Provincia
  } else {
    return 15; // Interior
  }
};