#!/bin/bash

# Video Compression Script
# Compresses WebM videos to reduce bundle size
# Requires: ffmpeg

echo "🎬 Video Compression Script"
echo "=============================="
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install ffmpeg
    else
        echo "Please install ffmpeg: sudo apt-get install ffmpeg"
        exit 1
    fi
fi

PUBLIC_ASSETS="/Users/chrsitiantoscano/Desktop/kioto/frontend/public/assets"

# Function to compress video
compress_video() {
    local input_file="$1"
    local filename=$(basename "$input_file")
    local name="${filename%.*}"
    local output_file="${PUBLIC_ASSETS}/${name}-compressed.webm"
    
    echo "📹 Compressing: $filename"
    
    # Get original size
    original_size=$(du -h "$input_file" | cut -f1)
    echo "  Original size: $original_size"
    
    # Compress with ffmpeg
    # -crf 30-35 for good quality with smaller size
    # -b:v 0 for constant quality mode
    ffmpeg -i "$input_file" \
        -c:v libvpx-vp9 \
        -crf 35 \
        -b:v 0 \
        -cpu-used 4 \
        -row-mt 1 \
        -an \
        "$output_file" \
        -y \
        -loglevel error

    if [ $? -eq 0 ]; then
        compressed_size=$(du -h "$output_file" | cut -f1)
        echo "  ✅ Compressed size: $compressed_size"
        echo "  📁 Saved as: ${name}-compressed.webm"
        
        # Calculate savings
        original_bytes=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file")
        compressed_bytes=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file")
        savings=$(echo "scale=1; ($original_bytes - $compressed_bytes) * 100 / $original_bytes" | bc)
        echo "  💰 Saved: ${savings}%"
    else
        echo "  ❌ Compression failed"
    fi
    
    echo ""
}

# Compress all videos in public/assets
echo "🔍 Finding videos in public/assets/..."
find "$PUBLIC_ASSETS" -type f -name "*.webm" ! -name "*-compressed.webm" | while read -r file; do
    compress_video "$file"
done

echo ""
echo "✅ Video compression complete!"
echo ""
echo "📊 Size comparison:"
echo "Before:"
find "$PUBLIC_ASSETS" -name "*.webm" ! -name "*-compressed.webm" -exec du -ch {} + | tail -1 2>/dev/null || echo "N/A"
echo ""
echo "After (compressed):"
find "$PUBLIC_ASSETS" -name "*-compressed.webm" -exec du -ch {} + | tail -1 2>/dev/null || echo "N/A"

echo ""
echo "⚠️  Next steps:"
echo "1. Test compressed videos in browser"
echo "2. If quality is acceptable, rename compressed files:"
echo "   cd $PUBLIC_ASSETS"
echo "   for f in *-compressed.webm; do mv \"\$f\" \"\${f/-compressed/}\"; done"
echo "3. Delete originals if not needed"
