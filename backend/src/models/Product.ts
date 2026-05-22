import mongoose, { Document, Model } from 'mongoose';

export type InventoryMode = 'unit' | 'color' | 'size_color';

export interface ColorStockLine {
  color: string;
  label?: string;
  stock: number;
}

export interface SizeVariant {
  size: string;
  colors: ColorStockLine[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  price: number;
  images: string[];
  description: string;
  inventoryMode: InventoryMode;
  stock?: number;
  colors?: ColorStockLine[];
  sizeVariants?: SizeVariant[];
  published: boolean;
  materials?: string;
  category?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const colorStockLineSchema = new mongoose.Schema<ColorStockLine>(
  {
    color: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock must be non-negative'],
      default: 0,
    },
  },
  { _id: true },
);

const sizeVariantSchema = new mongoose.Schema<SizeVariant>(
  {
    size: {
      type: String,
      required: true,
      trim: true,
    },
    colors: {
      type: [colorStockLineSchema],
      default: [],
    },
  },
  { _id: true },
);

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
    inventoryMode: {
      type: String,
      enum: ['unit', 'color', 'size_color'],
      required: true,
      default: 'unit',
    },
    stock: {
      type: Number,
      min: [0, 'Stock must be non-negative'],
      default: 0,
    },
    colors: {
      type: [colorStockLineSchema],
      default: undefined,
    },
    sizeVariants: {
      type: [sizeVariantSchema],
      default: undefined,
    },
    published: {
      type: Boolean,
      default: false,
    },
    materials: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ published: 1, createdAt: -1 });
productSchema.index({ published: 1, slug: 1 });
productSchema.index({ category: 1, published: 1 });
productSchema.index({ inventoryMode: 1, published: 1 });

productSchema.pre<IProduct>('validate', function validateInventory(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  if (this.inventoryMode === 'unit') {
    this.colors = undefined;
    this.sizeVariants = undefined;
    this.stock = this.stock ?? 0;
  }

  if (this.inventoryMode === 'color') {
    this.stock = undefined;
    this.sizeVariants = undefined;
  }

  if (this.inventoryMode === 'size_color') {
    this.stock = undefined;
    this.colors = undefined;
  }

  next();
});

productSchema.virtual('totalStock').get(function getTotalStock() {
  if (this.inventoryMode === 'unit') {
    return this.stock || 0;
  }

  if (this.inventoryMode === 'color') {
    return (this.colors || []).reduce((sum, line) => sum + (line.stock || 0), 0);
  }

  return (this.sizeVariants || []).reduce(
    (sum, sizeVariant) =>
      sum + (sizeVariant.colors || []).reduce((colorSum, line) => colorSum + (line.stock || 0), 0),
    0,
  );
});

productSchema.virtual('imageUrls').get(function getImageUrls() {
  return this.images || [];
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;
