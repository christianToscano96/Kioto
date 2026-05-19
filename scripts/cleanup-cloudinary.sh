#!/bin/bash

# Clean Invalid Cloudinary URLs from Database
# Removes or replaces broken image URLs in products

echo "🧹 Cloudinary URL Cleanup Script"
echo "=============================="
echo ""

# MongoDB connection (adjust as needed)
MONGO_URI=${MONGO_URI:-"mongodb://localhost:27017/kioto"}

echo "📊 Checking for products with invalid image URLs..."
echo ""

# Node script to clean up
cat > /tmp/cleanup_images.js << 'EOF'
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  images: [String],
  // ... other fields
}, { strict: false });

const Product = mongoose.model('Product', ProductSchema);

async function cleanupImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kioto');
    console.log('✅ Connected to MongoDB');

    // Find products with images
    const products = await Product.find({ images: { $exists: true, $ne: [] } });
    console.log(`📦 Found ${products.length} products with images`);

    let fixedCount = 0;

    for (const product of products) {
      let needsUpdate = false;
      const validImages = [];

      for (const imageUrl of product.images) {
        // Check if URL is valid
        if (!imageUrl || imageUrl.trim() === '') {
          console.log(`❌ Empty URL in product: ${product.name}`);
          needsUpdate = true;
          continue;
        }

        // Check if it's a valid URL format
        try {
          if (imageUrl.startsWith('http')) {
            new URL(imageUrl);
          }
          validImages.push(imageUrl);
        } catch {
          console.log(`❌ Invalid URL in product ${product.name}: ${imageUrl}`);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        product.images = validImages.length > 0 
          ? validImages 
          : ['https://placehold.co/600x800/fdfae9/99452c?text=Sin+Imagen'];
        
        await product.save();
        fixedCount++;
        console.log(`✅ Fixed: ${product.name} (${validImages.length} valid images)`);
      }
    }

    console.log('');
    console.log(`✅ Cleanup complete! Fixed ${fixedCount} products`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupImages();
EOF

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  MongoDB doesn't seem to be running on localhost:27017"
    echo "Please start MongoDB or adjust MONGO_URI environment variable"
    echo ""
    echo "Usage: MONGO_URI='mongodb://your-host/your-db' ./cleanup-cloudinary.sh"
    exit 1
fi

# Run the cleanup
cd /Users/chrsitiantoscano/Desktop/kioto/backend
MONGO_URI="$MONGO_URI" node /tmp/cleanup_images.js

# Cleanup temp file
rm /tmp/cleanup_images.js

echo ""
echo "✅ Done!"
echo ""
echo "Next steps:"
echo "1. Restart your backend server"
echo "2. Clear browser cache"
echo "3. Test image loading"
