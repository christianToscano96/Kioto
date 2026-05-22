import { useEffect, useRef } from 'react';

const prefetchedRoutes = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetchedRoutes.has(path)) return;

  prefetchedRoutes.add(path);

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  link.as = 'document';
  document.head.appendChild(link);

  setTimeout(() => {
    link.remove();
  }, 5000);
}

/**
 * Prefetch critical routes on link hover or focus.
 */
export function usePrefetchRoute() {
  return { prefetchRoute };
}

/**
 * Prefetch cart/checkout on relevant pages.
 */
export function usePrefetchCriticalRoutes() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const shouldPrefetchCart =
      window.location.pathname.includes('/product') ||
      window.location.pathname === '/';

    if (shouldPrefetchCart) {
      setTimeout(() => {
        prefetchRoute('/cart');
      }, 2000);
    }

    if (window.location.pathname === '/cart') {
      setTimeout(() => {
        prefetchRoute('/checkout');
      }, 1000);
    }
  }, []);
}
