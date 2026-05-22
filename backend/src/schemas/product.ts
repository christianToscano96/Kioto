import { z } from 'zod';

const colorLineSchema = z.object({
  color: z.string().min(1, 'Color is required'),
  label: z.string().optional(),
  stock: z.number().int().min(0).default(0),
});

const sizeVariantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  colors: z.array(colorLineSchema).min(1, 'At least one color is required per size'),
});

const inventoryFieldsSchema = z.object({
  inventoryMode: z.enum(['unit', 'color', 'size_color']),
  stock: z.number().int().min(0).optional(),
  colors: z.array(colorLineSchema).optional(),
  sizeVariants: z.array(sizeVariantSchema).optional(),
});

const validateInventoryFields = (
  data: z.infer<typeof inventoryFieldsSchema>,
  ctx: z.RefinementCtx,
) => {
  if (data.inventoryMode === 'unit') {
    if (data.stock === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Stock is required for unit inventory',
        path: ['stock'],
      });
    }
    return;
  }

  if (data.inventoryMode === 'color') {
    if (!data.colors || data.colors.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one color line is required',
        path: ['colors'],
      });
      return;
    }

    const uniqueColors = new Set(data.colors.map((line) => line.color));
    if (uniqueColors.size !== data.colors.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Duplicate colors are not allowed',
        path: ['colors'],
      });
    }
    return;
  }

  if (!data.sizeVariants || data.sizeVariants.length === 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'At least one size variant is required',
      path: ['sizeVariants'],
    });
    return;
  }

  const uniqueSizes = new Set(data.sizeVariants.map((variant) => variant.size));
  if (uniqueSizes.size !== data.sizeVariants.length) {
    ctx.addIssue({
      code: 'custom',
      message: 'Duplicate sizes are not allowed',
      path: ['sizeVariants'],
    });
  }

  data.sizeVariants.forEach((variant, index) => {
    const uniqueColors = new Set(variant.colors.map((line) => line.color));
    if (uniqueColors.size !== variant.colors.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'Duplicate colors are not allowed within a size',
        path: ['sizeVariants', index, 'colors'],
      });
    }
  });
};

const productBodySchema = z
  .object({
    name: z.string().min(1, 'Product name is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images allowed').optional().default([]),
    description: z.string().min(1, 'Description is required'),
    published: z.boolean().default(false),
    materials: z.string().optional(),
    category: z.string().optional(),
  })
  .and(inventoryFieldsSchema)
  .superRefine(validateInventoryFields);

export const createProductSchema = z.object({
  body: productBodySchema,
});

const updateProductBodySchema = z
  .object({
    name: z.string().min(1, 'Product name is required').optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    images: z.array(z.string().url('Invalid image URL')).max(5, 'Maximum 5 images allowed').optional(),
    description: z.string().min(1, 'Description is required').optional(),
    published: z.boolean().optional(),
    materials: z.string().optional(),
    category: z.string().optional(),
    inventoryMode: z.enum(['unit', 'color', 'size_color']).optional(),
    stock: z.number().int().min(0).optional(),
    colors: z.array(colorLineSchema).optional(),
    sizeVariants: z.array(sizeVariantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.inventoryMode) return;
    validateInventoryFields(
      {
        inventoryMode: data.inventoryMode,
        stock: data.stock,
        colors: data.colors,
        sizeVariants: data.sizeVariants,
      },
      ctx,
    );
  });

export const updateProductSchema = z.object({
  body: updateProductBodySchema,
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => parseInt(val || '1', 10)),
    limit: z.string().optional().transform((val) => parseInt(val || '10', 10)),
    search: z.string().optional(),
  }),
});
