import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import { authenticate, adminOnly } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createProductSchema, updateProductSchema } from '../schemas/product';

const router = Router();

const sanitizeInventoryPayload = (payload: Record<string, unknown>) => {
  const {
    name,
    price,
    images,
    description,
    published,
    materials,
    category,
    inventoryMode,
    stock,
    colors,
    sizeVariants,
  } = payload;

  const base = {
    name,
    price,
    images: images || [],
    description,
    published,
    materials,
    category,
    inventoryMode,
  };

  if (inventoryMode === 'unit') {
    return { ...base, stock: stock ?? 0 };
  }

  if (inventoryMode === 'color') {
    return { ...base, colors: colors || [] };
  }

  return { ...base, sizeVariants: sizeVariants || [] };
};

router.get('/public', async (_req: Request, res: Response) => {
  try {
    const products = await Product.find({ published: true }).populate('category', 'name').sort({ createdAt: -1 }).lean();
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/public', authenticate, adminOnly, validate(createProductSchema), async (req: Request, res: Response) => {
  try {
    const product = await Product.create(sanitizeInventoryPayload(req.body));
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.use(authenticate, adminOnly);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', validate(createProductSchema), async (req: Request, res: Response) => {
  try {
    const product = await Product.create(sanitizeInventoryPayload(req.body));
    res.status(201).json({ product });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      res.status(409).json({ error: 'Product with this name already exists' });
      return;
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', validate(updateProductSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body.inventoryMode
      ? sanitizeInventoryPayload({ ...req.body })
      : req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true },
    );

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.status(200).json({ product });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      res.status(409).json({ error: 'Product with this name already exists' });
      return;
    }
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
