import { Router, Request, Response } from 'express';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { uploadToCloudinary } from '../services/cloudinary';
import { authenticate, adminOnly } from '../middleware/auth';

const router = Router();

router.use(authenticate, adminOnly);

// POST /api/upload/image - Upload single image
router.post('/image', uploadSingle, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }

    const result = await uploadToCloudinary(req.file.buffer, 'products');
    res.json({ url: result.url, public_id: result.public_id });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// POST /api/upload/images - Upload multiple images
router.post('/images', uploadMultiple, async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400).json({ error: 'No images provided' });
      return;
    }

    const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
      uploadToCloudinary(file.buffer, 'products')
    );

    const results = await Promise.all(uploadPromises);
    res.json(results.map(r => ({ url: r.url, public_id: r.public_id })));
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// POST /api/upload/category-image - Upload category image
router.post('/category-image', uploadSingle, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }

    const result = await uploadToCloudinary(req.file.buffer, 'categories');
    res.json({ url: result.url, public_id: result.public_id });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;