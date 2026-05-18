import { Types } from 'mongoose';
import Product, { IProduct } from '../models/Product';

interface StockSelection {
  size?: string;
  color?: string;
}

interface ResolvedStockSelection {
  size?: string;
  color?: string;
  availableStock: number;
  usesVariant: boolean;
  usesColorStock: boolean;
}

const normalizeOptional = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const resolveStockSelection = (
  product: IProduct,
  selection: StockSelection = {},
): ResolvedStockSelection => {
  const variants = product.variants || [];
  const size = normalizeOptional(selection.size);
  const color = normalizeOptional(selection.color);

  if (variants.length === 0) {
    return {
      size,
      color,
      availableStock: product.stock || 0,
      usesVariant: false,
      usesColorStock: false,
    };
  }

  if (!size) {
    throw new Error('Size is required for this product');
  }

  const variant = variants.find((item: any) => item.size === size);
  if (!variant) {
    throw new Error(`Size ${size} not available for this product`);
  }

  const colorStock = variant.colorStock || [];
  if (colorStock.length === 0) {
    return {
      size,
      color,
      availableStock: variant.stock || 0,
      usesVariant: true,
      usesColorStock: false,
    };
  }

  const resolvedColor = color || (colorStock.length === 1 ? colorStock[0].name : undefined);
  if (!resolvedColor) {
    throw new Error('Color is required for this product');
  }

  const colorEntry = colorStock.find((item: any) => item.name === resolvedColor);
  if (!colorEntry) {
    throw new Error(`Color ${resolvedColor} not available for size ${size}`);
  }

  return {
    size,
    color: resolvedColor,
    availableStock: colorEntry.stock || 0,
    usesVariant: true,
    usesColorStock: true,
  };
};

export const assertStockAvailable = (
  product: IProduct,
  quantity: number,
  selection: StockSelection = {},
): ResolvedStockSelection => {
  const resolved = resolveStockSelection(product, selection);

  if (resolved.availableStock < quantity) {
    throw new Error(`Requested quantity exceeds available stock. Available: ${resolved.availableStock}`);
  }

  return resolved;
};

export const deductProductStock = async (
  productId: Types.ObjectId | string,
  quantity: number,
  selection: StockSelection = {},
): Promise<ResolvedStockSelection> => {
  const product = await Product.findById(productId).select('stock variants').exec();
  if (!product) {
    throw new Error('Product not found');
  }

  const resolved = assertStockAvailable(product, quantity, selection);

  if (!resolved.usesVariant) {
    const result = await Product.updateOne(
      { _id: product._id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
    );

    if (result.modifiedCount !== 1) {
      throw new Error('Insufficient stock');
    }

    return resolved;
  }

  if (resolved.usesColorStock) {
    const result = await Product.updateOne(
      { _id: product._id },
      { $inc: { 'variants.$[variant].colorStock.$[color].stock': -quantity } },
      {
        arrayFilters: [
          { 'variant.size': resolved.size },
          { 'color.name': resolved.color, 'color.stock': { $gte: quantity } },
        ],
      },
    );

    if (result.modifiedCount !== 1) {
      throw new Error('Insufficient stock');
    }

    return resolved;
  }

  const result = await Product.updateOne(
    {
      _id: product._id,
      variants: { $elemMatch: { size: resolved.size, stock: { $gte: quantity } } },
    },
    { $inc: { 'variants.$.stock': -quantity } },
  );

  if (result.modifiedCount !== 1) {
    throw new Error('Insufficient stock');
  }

  return resolved;
};

export const restoreProductStock = async (
  productId: Types.ObjectId | string,
  quantity: number,
  selection: StockSelection = {},
): Promise<void> => {
  const product = await Product.findById(productId).select('stock variants').exec();
  if (!product) return;

  const resolved = resolveStockSelection(product, selection);

  if (!resolved.usesVariant) {
    await Product.updateOne({ _id: product._id }, { $inc: { stock: quantity } });
    return;
  }

  if (resolved.usesColorStock) {
    await Product.updateOne(
      { _id: product._id },
      { $inc: { 'variants.$[variant].colorStock.$[color].stock': quantity } },
      {
        arrayFilters: [
          { 'variant.size': resolved.size },
          { 'color.name': resolved.color },
        ],
      },
    );
    return;
  }

  await Product.updateOne(
    { _id: product._id, 'variants.size': resolved.size },
    { $inc: { 'variants.$.stock': quantity } },
  );
};

export const deductStockForItems = async (
  items: Array<{ productId: Types.ObjectId | string | IProduct; quantity: number; size?: string; color?: string }>,
): Promise<void> => {
  const deducted: Array<{ productId: Types.ObjectId | string; quantity: number; size?: string; color?: string }> = [];

  try {
    for (const item of items) {
      const productId = typeof item.productId === 'object' && '_id' in item.productId
        ? item.productId._id
        : item.productId;
      const resolved = await deductProductStock(productId, item.quantity, {
        size: item.size,
        color: item.color,
      });
      deducted.push({
        productId,
        quantity: item.quantity,
        size: resolved.size,
        color: resolved.color,
      });
    }
  } catch (error) {
    await Promise.allSettled(
      deducted.map((item) => restoreProductStock(item.productId, item.quantity, item)),
    );
    throw error;
  }
};
