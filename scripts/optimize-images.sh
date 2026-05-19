#!/bin/bash

# Image Optimization Script
# Converts all JPG/PNG images to WebP and generates responsive sizes

echo "🖼️  Image Optimization Script"
echo "=============================="
echo ""

# Check if webp tools are installed
if ! command -v cwebp &> /dev/null; then
    echo "❌ cwebp not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install webp
    else
        echo "Please install webp tools: sudo apt-get install webp"
        exit 1
    fi
fi

# Function to optimize single image
optimize_image() {
    local input_file="$1"
    local filename=$(basename "$input_file")
    local dirname=$(dirname "$input_file")
    local name="${filename%.*}"
    
    echo "Processing: $filename"
    
    # Generate WebP version
    cwebp -q 80 "$input_file" -o "$dirname/${name}.webp"
    
    # Generate responsive sizes (400w, 800w, 1200w)
    if command -v convert &> /dev/null; then
        convert "$input_file" -resize 400x "$dirname/${name}-400w.webp"
        convert "$input_file" -resize 800x "$dirname/${name}-800w.webp"
        convert "$input_file" -resize 1200x "$dirname/${name}-1200w.webp"
    fi
    
    echo "  ✅ Created WebP versions"
}

# Process public directory images
echo "🔍 Finding images in public/..."
find frontend/public -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r file; do
    optimize_image "$file"
done

# Process src/assets images
echo ""
echo "🔍 Finding images in src/assets/..."
find frontend/assets -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | while read -r file; do
    optimize_image "$file"
done

echo ""
echo "✅ Image optimization complete!"
echo ""
echo "📊 Size comparison:"
echo "Before:"
du -sh frontend/public 2>/dev/null || echo "N/A"
echo ""
echo "After (WebP):"
find frontend/public -name "*.webp" -exec du -ch {} + | tail -1 2>/dev/null || echo "N/A"

echo ""
echo "⚠️  Next steps:"
echo "1. Update image references to use .webp extension"
echo "2. Implement <picture> element for fallbacks"
echo "3. Delete original JPG/PNG if not needed"
echo ""
echo "Example usage:"
echo '<picture>'
echo '  <source srcset="/image.webp" type="image/webp">'
echo '  <img src="/image.jpg" alt="Description">'
echo '</picture>'
