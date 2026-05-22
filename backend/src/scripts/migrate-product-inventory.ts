import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';

dotenv.config();

interface LegacyColorStock {
  name?: string;
  color?: string;
  stock?: number;
}

interface LegacyVariant {
  size?: string;
  colorStock?: LegacyColorStock[];
  colors?: LegacyColorStock[];
}

interface LegacyProduct {
  _id: mongoose.Types.ObjectId;
  stock?: number;
  sizes?: string[];
  colors?: unknown[];
  variants?: LegacyVariant[];
  inventoryMode?: string;
}

const mapColorLines = (lines: LegacyColorStock[] = []) =>
  lines
    .filter((line) => line && (line.color || line.name))
    .map((line) => ({
      color: line.color || line.name || '',
      stock: line.stock ?? 0,
    }))
    .filter((line) => line.color);

async function migrateProductInventory() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const products = await Product.collection.find({}).toArray() as LegacyProduct[];
  let migrated = 0;
  let skipped = 0;

  for (const product of products) {
    if (product.inventoryMode) {
      skipped += 1;
      continue;
    }

    const update: {
      $set?: Record<string, unknown>;
      $unset?: Record<string, ''>;
    } = {
      $unset: {
        sizes: '',
        variants: '',
      },
    };

    if (product.variants && product.variants.length > 0) {
      update.$set = {
        inventoryMode: 'size_color',
        sizeVariants: product.variants.map((variant) => ({
          size: variant.size,
          colors: mapColorLines(variant.colorStock || variant.colors),
        })),
      };
    } else if (
      Array.isArray(product.colors) &&
      product.colors.length > 0 &&
      typeof product.colors[0] === 'object'
    ) {
      update.$set = {
        inventoryMode: 'color',
        colors: mapColorLines(product.colors as LegacyColorStock[]),
      };
    } else if (Array.isArray(product.colors) && product.colors.length > 0) {
      const perColorStock = Math.floor((product.stock || 0) / product.colors.length);
      update.$set = {
        inventoryMode: 'color',
        colors: (product.colors as string[]).map((color) => ({
          color,
          stock: perColorStock,
        })),
      };
    } else {
      update.$set = {
        inventoryMode: 'unit',
        stock: product.stock ?? 0,
      };
      update.$unset = {
        ...update.$unset,
        colors: '',
      };
    }

    await Product.collection.updateOne({ _id: product._id }, update);
    migrated += 1;
  }

  console.log(`Migration complete. Migrated: ${migrated}, skipped: ${skipped}`);
  await mongoose.disconnect();
}

migrateProductInventory().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
