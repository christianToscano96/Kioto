# Optimización de Imágenes

## Problema Actual
Las 149 requests probablemente incluyen muchas imágenes sin optimizar.

## Soluciones

### 1. Usar WebP en lugar de PNG/JPG
```bash
# Convertir imágenes existentes
brew install webp
find public -name "*.jpg" -o -name "*.png" | while read file; do
  cwebp -q 80 "$file" -o "${file%.*}.webp"
done
```

### 2. Responsive Images con srcset
```tsx
<img
  src="/image-400w.webp"
  srcSet="
    /image-400w.webp 400w,
    /image-800w.webp 800w,
    /image-1200w.webp 1200w
  "
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
  alt="Product"
  loading="lazy"
/>
```

### 3. Usar CDN de imágenes (Cloudinary)
Ya está implementado en `OptimizedImage.tsx` pero asegurate de:
- Subir imágenes a Cloudinary
- Usar transformaciones automáticas
- Activar formato auto (f_auto)
- Activar calidad auto (q_auto)

Ejemplo URL Cloudinary:
```
https://res.cloudinary.com/[cloud-name]/image/upload/f_auto,q_auto,w_800/[imagen]
```

### 4. Preload de imágenes críticas
En `index.html`:
```html
<link rel="preload" as="image" href="/hero-image.webp" />
```

## Impacto Esperado
- Reducción de 60-70% en peso de imágenes
- Requests de ~149 a ~80-90
- Recursos de 12.5 MB a ~4-5 MB
