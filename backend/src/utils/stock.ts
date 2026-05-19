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

interface _ProductLean {
  variants: Array<{ size: string; stock: number; colorStock: Array<{ name: string; stock: number }> }>;
  stock: number;
  _id: Types.ObjectId;
}

const normalizeOptional = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};


const _buildColorFilterExpr = (
  removeByName: boolean,
  colorName?: string,
): Record<string, unknown> =>
  removeByName
    ? {
        $filter: {
          input: {
            $filter: {
              input: '$$v.colorStock',
              as: 'c',
              cond: { $ne: ['$$c.name', colorName!] },
            },
          },
          as: 'cs',
          cond: { $gt: ['$$cs.stock', 0] },
        },
      }
    : {
        $filter: {
          input: '$$v.colorStock',
          as: 'cs',
          cond: { $gt: ['$$cs.stock', 0] },
        },
      };

async function cleanupEmptyEntries(
  productId: Types.ObjectId | string,
  size?: string,
  color?: string,
): Promise<void> {
  const removeByName = !!size && !!color;

  const [result] = await Product.aggregate([
    {
      $set: {
        variants: {
          $map: {
            input: '$variants',
            as: 'v',
            in: {
              size: '$$v.size',
              colorStock: _buildColorFilterExpr(removeByName, color),
            },
          },
        },
      },
    },
    // ── Stage 2: drop variants whose colorStock is now empty ─────────────────
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
    { $project: { _id: 1, variants: 1, stock: 1 }     },
  ]);

  const aggregated = result as _ProductLean;
  if (!aggregated || _isNoOpUpdate(aggregated, productId)) return;

  await Product.updateOne({ _id: productId }, aggregated);
}


async function _isNoOpUpdate(
  aggregated: _ProductLean,
  productId: Types.ObjectId | string,
): Promise<boolean> {
  const current = await Product.findById(productId).select('variants stock').lean().exec();
  if (!current) return false;

  const variantsUnchanged =
    (current.variants?.length || 0) === (aggregated.variants?.length || 0) &&
    (current.variants || []).every(
      (pv, i) =>
        pv.size === aggregated.variants?.[i]?.size &&
        (pv.stock || 0) === (aggregated.variants?.[i]?.stock || 0) &&
        (pv.colorStock || []).length === (aggregated.variants?.[i]?.colorStock?.length || 0) &&
        (pv.colorStock || []).every(
          (pc, ci) =>
            pc.name === aggregated.variants?.[i]?.colorStock?.[ci]?.name &&
            pc.stock === aggregated.variants?.[i]?.colorStock?.[ci]?.stock,
        ),
    );

  return variantsUnchanged && current.stock === aggregated.stock;
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
    throw new Error(`Size is required for this product (productId: ${product._id.toString()}, stock: ${product.stock}, variants: ${variants.length})`);
  }

  const variant = variants.find((v) => v.size === size);
  if (!variant) {
    throw new Error(`Size ${size} not available for this product (productId: ${product._id.toString()}, sizes: ${variants.map((v) => v.size).join(', ') || 'none'})`);
  }

  const colorStock = variant.colorStock || [];

  // Variant exists but has no colorStock → stock lives in variant.stock
  if (colorStock.length === 0) {
    return { size, color, availableStock: variant.stock || 0, usesVariant: true, usesColorStock: false };
  }

  // ColorStock exists → colour must be resolved
  const resolvedColor = color || (colorStock.length === 1 ? colorStock[0].name : undefined);
  if (!resolvedColor) {
    throw new Error(`Color is required for this product (productId: ${product._id.toString()}, size: ${size}, colors: ${colorStock.map((c) => `${c.name}(${c.stock})`).join(', ')})`);
  }

  const colorEntry = colorStock.find((c) => c.name === resolvedColor);
  if (!colorEntry) {
    throw new Error(`Color ${resolvedColor} not available for size ${size} (productId: ${product._id.toString()}, available: ${colorStock.map((c) => c.name).join(', ')})`);
  }

  return { size, color: resolvedColor, availableStock: colorEntry.stock || 0, usesVariant: true, usesColorStock: true };
};

export const assertStockAvailable = (
  product: IProduct,
  quantity: number,
  selection: StockSelection = {},
): ResolvedStockSelection => {
  const resolved = resolveStockSelection(product, selection);
  if (resolved.availableStock < quantity) {
    throw new Error(`Not enough stock — only ${resolved.availableStock} available`);
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
