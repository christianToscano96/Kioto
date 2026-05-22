import { Types } from 'mongoose';
import Product, { IProduct } from '../models/Product';
import {
  getTotalStock,
  resolveInventory,
  type InventorySelection,
  type ResolvedInventory,
} from './inventory';

export type { InventorySelection, ResolvedInventory };

export const resolveStockSelection = (
  product: IProduct,
  selection: InventorySelection = {},
): ResolvedInventory => resolveInventory(product, selection);

export const assertStockAvailable = (
  product: IProduct,
  quantity: number,
  selection: InventorySelection = {},
): ResolvedInventory => {
  const resolved = resolveStockSelection(product, selection);

  if (resolved.availableStock < quantity) {
    throw new Error(`Requested quantity exceeds available stock. Available: ${resolved.availableStock}`);
  }

  return resolved;
};

export const deductProductStock = async (
  productId: Types.ObjectId | string,
  quantity: number,
  selection: InventorySelection = {},
): Promise<ResolvedInventory> => {
  const product = await Product.findById(productId)
    .select('inventoryMode stock colors sizeVariants')
    .exec();

  if (!product) {
    throw new Error('Product not found');
  }

  const resolved = assertStockAvailable(product, quantity, selection);

  if (resolved.inventoryMode === 'unit') {
    const result = await Product.updateOne(
      { _id: product._id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
    );

    if (result.modifiedCount !== 1) {
      throw new Error('Insufficient stock');
    }

    return resolved;
  }

  if (resolved.inventoryMode === 'color') {
    const result = await Product.updateOne(
      { _id: product._id },
      { $inc: { 'colors.$[colorLine].stock': -quantity } },
      {
        arrayFilters: [
          { 'colorLine.color': resolved.resolvedColor, 'colorLine.stock': { $gte: quantity } },
        ],
      },
    );

    if (result.modifiedCount !== 1) {
      throw new Error('Insufficient stock');
    }

    return resolved;
  }

  const result = await Product.updateOne(
    { _id: product._id },
    { $inc: { 'sizeVariants.$[sizeVariant].colors.$[colorLine].stock': -quantity } },
    {
      arrayFilters: [
        { 'sizeVariant.size': resolved.resolvedSize },
        { 'colorLine.color': resolved.resolvedColor, 'colorLine.stock': { $gte: quantity } },
      ],
    },
  );

  if (result.modifiedCount !== 1) {
    throw new Error('Insufficient stock');
  }

  return resolved;
};

export const restoreProductStock = async (
  productId: Types.ObjectId | string,
  quantity: number,
  selection: InventorySelection = {},
): Promise<void> => {
  const product = await Product.findById(productId)
    .select('inventoryMode stock colors sizeVariants')
    .exec();

  if (!product) return;

  const resolved = resolveStockSelection(product, selection);

  if (resolved.inventoryMode === 'unit') {
    await Product.updateOne({ _id: product._id }, { $inc: { stock: quantity } });
    return;
  }

  if (resolved.inventoryMode === 'color') {
    await Product.updateOne(
      { _id: product._id },
      { $inc: { 'colors.$[colorLine].stock': quantity } },
      {
        arrayFilters: [{ 'colorLine.color': resolved.resolvedColor }],
      },
    );
    return;
  }

  await Product.updateOne(
    { _id: product._id },
    { $inc: { 'sizeVariants.$[sizeVariant].colors.$[colorLine].stock': quantity } },
    {
      arrayFilters: [
        { 'sizeVariant.size': resolved.resolvedSize },
        { 'colorLine.color': resolved.resolvedColor },
      ],
    },
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
        size: resolved.resolvedSize,
        color: resolved.resolvedColor,
      });
    }
  } catch (error) {
    await Promise.allSettled(
      deducted.map((item) => restoreProductStock(item.productId, item.quantity, item)),
    );
    throw error;
  }
};

export const restoreStockForItems = async (
  items: Array<{ productId: Types.ObjectId | string | IProduct; quantity: number; size?: string; color?: string }>,
): Promise<void> => {
  for (const item of items) {
    const productId = typeof item.productId === 'object' && '_id' in item.productId
      ? item.productId._id
      : item.productId;
    await restoreProductStock(productId, item.quantity, {
      size: item.size,
      color: item.color,
    });
  }
};

export { getTotalStock };
