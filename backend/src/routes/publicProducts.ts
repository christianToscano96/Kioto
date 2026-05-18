import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import { validate } from '../middleware/validation';
import { productQuerySchema } from '../schemas/product';

const router = Router();

// GET /api/public/products - List published products with pagination
router.get('/products', validate(productQuerySchema), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    // Build query - only published products
    const query: Record<string, unknown> = { published: true };

    // Add search functionality if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .populate('category', 'name') // Populate category name
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/public/products/:id - Get single product by ID or slug
 router.get('/products/:id', async (req: Request, res: Response) => {
   try {
     const { id } = req.params;
     
     // Check if id is a valid ObjectId (24 hex characters)
     const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
     
     let product = null;
     
     // If it looks like an ObjectId, try to find by ID first
     if (isObjectId) {
       product = await Product.findById(id).select('-__v').populate('category', 'name').lean();
       
       // If found by ID but not published, try by slug
       if (product && (product as any).published === false) {
         product = null;
       }
     }
     
     // If not found by ID (or wasn't an ObjectId), try by slug
     if (!product) {
       product = await Product.findOne({ slug: id, published: true }).select('-__v').populate('category', 'name').lean();
     }

     if (!product) {
       res.status(404).json({ error: 'Product not found' });
       return;
     }

     res.status(200).json({ product });
   } catch (error) {
     console.error('Error fetching product:', error);
     res.status(500).json({ error: 'Failed to fetch product' });
   }
 });

// GET /api/public/products/slug/:slug - Get single product by slug (alias)
router.get('/products/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, published: true }).select('-__v').populate('category', 'name').lean();

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/public/colors - Get all unique colors from published products
router.get('/colors', async (_req: Request, res: Response) => {
  try {
    const [legacyColors, variantColors] = await Promise.all([
      Product.distinct<string>('colors', { published: true }),
      Product.aggregate([
        { $match: { published: true } },
        { $unwind: '$variants' },
        { $unwind: '$variants.colorStock' },
        { $group: { _id: '$variants.colorStock.name' } },
      ]),
    ]);

    const colors = new Set<string>();
    legacyColors.forEach((color) => {
      if (typeof color === 'string' && color.length > 0) colors.add(color);
    });
    variantColors.forEach((entry) => {
      if (typeof entry._id === 'string' && entry._id.length > 0) colors.add(entry._id);
    });

    res.status(200).json({ colors: Array.from(colors).sort() });
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ error: 'Failed to fetch colors' });
  }
});

export default router;