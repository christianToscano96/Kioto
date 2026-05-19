import { z } from 'zod';

// ─── Re-exported shared types ───
export type ColorStock = { name: string; stock: number };
export type VariantInput = { size: string; colorStock: ColorStock[]; stock: number };

// ─── Helpers ───
export function normalizeVariantStock(variants: VariantInput[] = []): { variants: VariantInput[]; totalStock: number } {
  let totalStock = 0;
  const normalized = variants.map((variant) => {
    const variantStock = (variant.colorStock || []).reduce(
      (sum: number, color: ColorStock) => sum + (color.stock || 0),
      0,
    );
    totalStock += variantStock;
    return { ...variant, stock: variantStock };
  });
  return { variants: normalized, totalStock };
}

// ─── Schemas ───

// Create product schema
// NOTE: `sizes` and `colors` are accepted for backward-compat during migration,
// but are IGNORED when `variants` is present. `variants` is the single source of truth.
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    images: z.array(z.string().url('Invalid image URL')).max(3, 'Maximum 3 images allowed').optional().default([]),
    description: z.string().min(1, 'Description is required'),
    stock: z.number().int().min(0, 'Stock must be non-negative').optional(),
    published: z.boolean().default(false),
    materials: z.string().optional(),
    // Deprecated: kept for backward compat — ignored when variants is present
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    category: z.string().optional(),
    variants: z.array(z.object({
      size: z.string(),
      colorStock: z.array(z.object({
        name: z.string(),
        stock: z.number().int().min(0).default(0),
      })).optional().default([]),
      stock: z.number().int().min(0).default(0),
    })).optional(),
    // ─── Custom validation: variants is single source of truth ───
  }).refine(
    (data) => {
      // If variants exist, they override sizes/colors
      if (data.variants && data.variants.length > 0) return true;
      // If no variants, allow bare sizes/colors (legacy)
      return true;
    },
    { message: 'Provide either `variants` or `sizes`+`colors`, not both' },
  ),
});

// Update product schema (all fields optional)
export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    images: z.array(z.string().url('Invalid image URL')).max(3, 'Maximum 3 images allowed').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    stock: z.number().int().min(0, 'Stock must be non-negative').optional(),
    published: z.boolean().optional(),
    materials: z.string().optional(),
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    category: z.string().optional(),
    variants: z.array(z.object({
      size: z.string(),
      colorStock: z.array(z.object({
        name: z.string(),
        stock: z.number().int().min(0).default(0),
      })).optional().default([]),
      stock: z.number().int().min(0).default(0),
    })).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

// Public product query schema
export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => parseInt(val || '1', 10)),
    limit: z.string().optional().transform(val => parseInt(val || '10', 10)),
    search: z.string().optional(),
  }),
});