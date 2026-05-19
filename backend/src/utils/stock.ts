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

// ─── cleanupEmptyEntries ─────────────────────────────────────────────────────

/**
 * Remove colorStock entries with 0 stock, and remove variants that become empty.
 * The entire clean-up runs as one `aggregate()` inside MongoDB — no read/write gap —
 * so two concurrent webhook calls for the same product can never clobber each other.
 *
 * Overloads:
 *   cleanupEmptyEntries(productId)                  — clean everything
 *   cleanupEmptyEntries(productId, size)            — clean only that size variant  (drop its 0-stock colors + the variant if empty)
 *   cleanupEmptyEntries(productId, size, color)     — drop that exact color entry from that size variant
 */
async function cleanupEmptyEntries(
  productId: Types.ObjectId | string,
  size?: string,
  color?: string,
): Promise<void> {
  // ── Pipeline ────────────────────────────────────────────────────────────
  //
  // Stage 1 — Filter colorStock
  //   (size + color)  → remove that color by name, then drop any 0-stock colours that slip through
  //   (size only)     → keep only colours with stock > 0
  //   (neither)       → keep only colours with stock > 0
  //   When size+color are given we FIRST remove the named colour, THEN we
  //   drop any 0-stock remnant so deleting the last colour of a variant
  //   also removes the variant in stage 2.
  //
  // Stage 2 — Drop empty variants (colorStock length === 0)
  //
  // Stage 3 — Recompute per-variant stock = sum of remaining colorStock.stock
  //
  // Stage 4 — Recompute product.stock = sum of variant.stock
  const [result] = await Product.aggregate([
    {
      $set: {
        variants: {
          $map: {
            input: '$variants',
            as: 'v',
            in: {
              size: '$$v.size',
              colorStock:
                size && color
                  ? // case 1: remove the named colour, then drop 0-stock
                    {
                      $filter: {
                        input: {
                          $filter: {
                            input: '$$v.colorStock',
                            as: 'c',
                            cond: { $ne: ['$$c.name', color] },
                          },
                        },
                        as: 'cs',
                        cond: { $gt: ['$$cs.stock', 0] },
                      },
                    }
                  : // case 2 & 3: keep only colours with stock > 0
                    {
                      $filter: {
                        input: '$$v.colorStock',
                        as: 'cs',
                        cond: { $gt: ['$$cs.stock', 0] },
                      },
                    },
            },
          },
        },
      },
    },
    {
      $set: {
        variants: {
          $filter: {
            input: '$variants',
            as: 'v',
            cond: { $gt: [{ $size: '$$v.colorStock' }, 0] },
          },
        },
      },
    },
    {
      $set: {
        variants: {
          $map: {
            input: '$variants',
            as: 'v',
            in: {
              size: '$$v.size',
              colorStock: '$$v.colorStock',
              stock: { $sum: '$$v.colorStock.stock' },
            },
          },
        },
      },
    },
    { $set: { stock: { $sum: '$variants.stock' } } },
    { $project: { _id: 1, variants: 1, stock: 1 } },
  ]);

  // ── No-op guard ──────────────────────────────────────────────────────────
  if (!result) return;

  const current = await Product.findById(productId).select('variants stock').lean().exec();
  if (!current) return;

  const variantsUnchanged =
    (current.variants?.length || 0) === (result.variants?.length || 0) &&
    (current.variants || []).every(
      (pv: any, i: number) =>
        pv.size === result.variants?.[i]?.size &&
        (pv.stock || 0) === (result.variants?.[i]?.stock || 0) &&
        (pv.colorStock || []).length === (result.variants?.[i]?.colorStock?.length || 0) &&
        (pv.colorStock || []).every(
          (pc: any, ci: number) =>
            pc.name === result.variants?.[i]?.colorStock?.[ci]?.name &&
            pc.stock === result.variants?.[i]?.colorStock?.[ci]?.stock,
        ),
    );

  if (variantsUnchanged && current.stock === result.stock) return; // nothing to do

  await Product.updateOne({ _id: current._id }, result);
}

// ─── resolveStockSelection ───────────────────────────────────────────────────

export const resolveStockSelection = (
  product: IProduct,
  selection: StockSelection = {},
): ResolvedStockSelection => {
  const variants = product.variants || [];
  const size = normalizeOptional(selection.size);
  const color = normalizeOptional(selection.color);

  // No variants → non-variant product, stock is at the top level
  if (variants.length === 0) {
    return { size, color, availableStock: product.stock || 0, usesVariant: false, usesColorStock: false };
  }

  if (!size) {
    throw new Error('Size is required for this product');
  }

  const variant = variants.find((v: any) => v.size === size);
  if (!variant) {
    throw new Error(`Size ${size} not available for this product`);
  }

  const colorStock = variant.colorStock || [];

  // Variant exists but has no colorStock → stock lives in variant.stock
  if (colorStock.length === 0) {
    return { size, color, availableStock: variant.stock || 0, usesVariant: true, usesColorStock: false };
  }

  // ColorStock exists → colour must be resolved
  const resolvedColor = color || (colorStock.length === 1 ? colorStock[0].name : undefined);
  if (!resolvedColor) {
    throw new Error('Color is required for this product');
  }

  const colorEntry = colorStock.find((c: any) => c.name === resolvedColor);
  if (!colorEntry) {
    throw new Error(`Color ${resolvedColor} not available for size ${size}`);
  }

  return { size, color: resolvedColor, availableStock: colorEntry.stock || 0, usesVariant: true, usesColorStock: true };
};

// ─── stock operations ────────────────────────────────────────────────────────

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
  if (!product) throw new Error('Product not found');

  const resolved = assertStockAvailable(product, quantity, selection);

  // ── Non-variant product: deduct from product.stock directly
  if (!resolved.usesVariant) {
    const result = await Product.updateOne(
      { _id: product._id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
    );
    if (result.modifiedCount !== 1) throw new Error('Insufficient stock');
    await cleanupEmptyEntries(product._id);
    return resolved;
  }

  // ── ColorStock variant: deduct from the specific color entry
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
    if (result.modifiedCount !== 1) throw new Error('Insufficient stock');
    await cleanupEmptyEntries(product._id, resolved.size, resolved.color);
    return resolved;
  }

  // ── Variant without colors: deduct from variant.stock
  const result = await Product.updateOne(
    {
      _id: product._id,
      variants: { $elemMatch: { size: resolved.size, stock: { $gte: quantity } } },
    },
    { $inc: { 'variants.$.stock': -quantity } },
  );
  if (result.modifiedCount !== 1) throw new Error('Insufficient stock');
  await cleanupEmptyEntries(product._id, resolved.size);
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
    await cleanupEmptyEntries(product._id);
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
    await cleanupEmptyEntries(product._id, resolved.size, resolved.color);
    return;
  }

  await Product.updateOne(
    { _id: product._id, 'variants.size': resolved.size },
    { $inc: { 'variants.$.stock': quantity } },
  );
  await cleanupEmptyEntries(product._id, resolved.size);
};

// ─── bulk helpers ────────────────────────────────────────────────────────────

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
      deducted.push({ productId, quantity: item.quantity, size: resolved.size, color: resolved.color });
    }
  } catch (error) {
    await Promise.allSettled(
      deducted.map((item) => restoreProductStock(item.productId, item.quantity, item)),
    );
    throw error;
  }
};
