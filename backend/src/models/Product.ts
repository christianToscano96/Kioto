import mongoose, { Document, Model } from 'mongoose';

// Interface for Product document
export interface IProduct extends Document {
  name: string;
  slug: string;
  price: number;
  images: string[];
  description: string;
  stock: number;
  published: boolean;
  materials?: string;
  sizes?: string[];
  colors?: string[];
  category?: mongoose.Types.ObjectId;
  variants?: { size: string; colorStock: { name: string; stock: number }[]; stock: number }[]; // Size + color variants
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const productSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    stock: {
      type: Number,
      required: false,
      min: [0, 'Stock must be non-negative'],
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
    materials: {
      type: String,
      trim: true,
    },
    sizes: [
      {
        type: String,
        trim: true,
      },
    ],
    colors: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    variants: [
      {
        size: {
          type: String,
          required: true,
          trim: true,
        },
        colorStock: [
          {
            name: {
              type: String,
              required: true,
              trim: true,
            },
            stock: {
              type: Number,
              required: true,
              min: [0, 'Stock must be non-negative'],
              default: 0,
            },
          },
        ],
        stock: {
          type: Number,
          required: true,
          min: [0, 'Stock must be non-negative'],
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
productSchema.index({ name: 'text', description: 'text' });

// Auto-generate slug from name before save
productSchema.pre<IProduct>('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Virtual for total stock (sum of colorStock across all variants or base stock)
productSchema.virtual('totalStock').get(function () {
  if (this.variants && this.variants.length > 0) {
    return this.variants.reduce((sum: number, v: any) => {
      const colorSum = (v.colorStock || []).reduce((cs: number, c: any) => cs + (c.stock || 0), 0);
      return sum + colorSum;
    }, 0);
  }
  return this.stock || 0;
});

// Virtual for image URLs (not persisted)
productSchema.virtual('imageUrls').get(function () {
  return this.images || [];
});

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Export model
const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;