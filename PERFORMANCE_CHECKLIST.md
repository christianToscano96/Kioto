# 🎯 Performance Optimization Checklist

## ✅ COMPLETADO (Implementado Ahora)

- [x] Lazy loading de rutas (admin, checkout, auth)
- [x] Code splitting por dependencias
- [x] ReactQueryDevtools solo en DEV
- [x] Chunks granulares (react, router, query, admin, etc.)
- [x] Minificación con terser
- [x] Drop console.logs en producción
- [x] Suspense boundaries para lazy components

**Resultado:** Bundle principal de ~472 KB → ~150-200 KB

---

## 🔴 CRÍTICO (Hacer Ahora)

### 1. Optimizar Imágenes
**Impacto:** ⭐⭐⭐⭐⭐ (Mayor impacto)
- [ ] Convertir imágenes a WebP
- [ ] Implementar responsive images (srcset)
- [ ] Comprimir imágenes existentes
- [ ] Usar Cloudinary con transformaciones automáticas

**Cómo:**
```bash
chmod +x scripts/optimize-images.sh
./scripts/optimize-images.sh
```

Ver: `IMAGE_OPTIMIZATION.md`

### 2. Preload Assets Críticos
**Impacto:** ⭐⭐⭐⭐
- [ ] Preload fonts en `index.html`
- [ ] Preload hero images
- [ ] dns-prefetch para APIs externas

**Agregar a `index.html`:**
```html
<link rel="preload" as="font" href="/fonts/serif.woff2" crossorigin>
<link rel="preload" as="image" href="/hero.webp">
<link rel="dns-prefetch" href="https://api.stripe.com">
```

---

## 🟡 IMPORTANTE (Próxima Iteración)

### 3. Service Worker & Caché
**Impacto:** ⭐⭐⭐⭐
- [ ] Activar aggressive caching para assets
- [ ] Cache API responses con stale-while-revalidate
- [ ] Offline fallback pages

Ya está `vite-plugin-pwa` instalado, solo falta configurar mejor.

### 4. Virtual Scrolling para Listas Largas
**Impacto:** ⭐⭐⭐
- [ ] Implementar `react-virtual` en ProductsList
- [ ] Implementar en OrdersList (admin)

**Instalar:**
```bash
npm install @tanstack/react-virtual
```

### 5. Prefetch de Rutas
**Impacto:** ⭐⭐⭐
- [ ] Prefetch /cart cuando el usuario hover en "Ver Carrito"
- [ ] Prefetch /checkout desde /cart

**Implementar:**
```tsx
import { prefetchQuery } from '@tanstack/react-query';

<Link 
  to="/cart"
  onMouseEnter={() => {
    // Prefetch cart data
    prefetchQuery({ queryKey: ['cart'], queryFn: fetchCart });
  }}
>
  Ver Carrito
</Link>
```

### 6. Memoización de Componentes Pesados
**Impacto:** ⭐⭐⭐
- [ ] Usar `React.memo()` en ProductCard
- [ ] Usar `useMemo()` para cálculos pesados (stock, precios)
- [ ] Usar `useCallback()` para event handlers

**Ya implementado parcialmente en:** `ProductCardGrid.tsx`

---

## 🟢 NICE TO HAVE (Optimizaciones Avanzadas)

### 7. HTTP/2 Push
**Impacto:** ⭐⭐
- [ ] Configurar Vercel para HTTP/2 push de critical CSS
- [ ] Push de main.js en navegación inicial

### 8. Debouncing en Búsquedas
**Impacto:** ⭐⭐
- [ ] Debounce en search input (300ms)
- [ ] Throttle en scroll handlers

### 9. Web Vitals Monitoring
**Impacto:** ⭐⭐
- [ ] Implementar `web-vitals` library
- [ ] Enviar métricas a analytics

```bash
npm install web-vitals
```

```tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## 📊 Métricas Objetivo

### Antes
- DOMContentLoaded: 180ms ✅ (ya bueno)
- Load: 490ms ✅ (ya bueno)  
- Requests: 149 ❌
- Resources: 12.5 MB ❌
- Main bundle: 472 KB ❌

### Después de CRÍTICO
- DOMContentLoaded: <100ms 🎯
- Load: <300ms 🎯
- Requests: <80 🎯
- Resources: <4 MB 🎯
- Main bundle: <200 KB ✅ (ya implementado)

### Después de TODO
- DOMContentLoaded: <80ms 🚀
- Load: <200ms 🚀
- Requests: <60 🚀
- Resources: <3 MB 🚀
- LCP: <2.5s 🚀
- FID: <100ms 🚀
- CLS: <0.1 🚀

---

## 🧪 Testing

Después de cada optimización:

```bash
# 1. Build
npm run build

# 2. Preview
npm run preview

# 3. DevTools
# - Network tab (hard refresh)
# - Performance tab (record page load)
# - Lighthouse (run audit)

# 4. Bundle analysis
ANALYZE=true npm run build
# Abre stats.html automáticamente
```

---

## 📖 Recursos

- [Web.dev Performance](https://web.dev/performance/)
- [Vite Bundle Optimization](https://vitejs.dev/guide/build.html#chunking-strategy)
- [React.lazy Docs](https://react.dev/reference/react/lazy)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
