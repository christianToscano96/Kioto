#!/bin/bash

# Performance Test Script
# Compara el rendimiento antes vs después de las optimizaciones

echo "🚀 Testing Performance Improvements..."
echo ""

# Build the project
echo "📦 Building production bundle..."
cd frontend
npm run build

echo ""
echo "📊 Bundle Analysis:"
echo "=================="

# Show bundle sizes
echo ""
echo "JavaScript Bundles:"
find dist/assets -name "*.js" -exec du -sh {} + | sort -h

echo ""
echo "CSS Bundles:"
find dist/assets -name "*.css" -exec du -sh {} + | sort -h

echo ""
echo "Total dist size:"
du -sh dist

echo ""
echo "📈 Expected Improvements:"
echo "========================"
echo "Before optimizations:"
echo "  - Main bundle: ~472 KB"
echo "  - Charts bundle: ~404 KB"  
echo "  - Total requests: 149"
echo "  - Total resources: 12.5 MB"
echo ""
echo "After optimizations:"
echo "  - Main bundle: ~150-200 KB ✅"
echo "  - Charts: Only loaded in /admin ✅"
echo "  - Estimated requests: ~60-80 ✅"
echo "  - Estimated resources: ~3-4 MB initial ✅"
echo ""
echo "🔍 To verify in browser:"
echo "1. npm run preview"
echo "2. Open DevTools → Network tab"
echo "3. Hard refresh (Cmd+Shift+R)"
echo "4. Check 'Transferred' column"
echo ""
echo "Expected results:"
echo "  - HomePage: ~200-300 KB transferred"
echo "  - Admin (first visit): +400 KB (charts)"
echo "  - Subsequent visits: <100 KB (cached)"
