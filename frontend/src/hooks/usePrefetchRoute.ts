import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Global cache to prevent duplicate prefetches
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch critical routes on link hover or focus
 * Improves perceived performance by loading next page before navigation
 */
export function usePrefetchRoute() {
  const location = useLocation();

  const prefetchRoute = (path: string) => {
    // Prevent duplicate prefetches
    if (prefetchedRoutes.has(path)) {
      return;
    }

    // Mark as prefetched
    prefetchedRoutes.add(path);

    // Create a link element to trigger prefetch
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    link.as = 'document';
    document.head.appendChild(link);

    // Clean up after prefetch
    setTimeout(() => {
      document.head.removeChild(link);
    }, 5000);
  };

  return { prefetchRoute };
}

/**
 * Hook to setup prefetch on critical routes
 */
export function usePrefetchCriticalRoutes() {
  const { prefetchRoute } = usePrefetchRoute();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasRun.current) return;
    hasRun.current = true;

    // Prefetch cart page when on product pages
    const shouldPrefetchCart = 
      window.location.pathname.includes('/product') ||
      window.location.pathname === '/';
    
    if (shouldPrefetchCart) {
      // Delay prefetch to not interfere with initial load
      setTimeout(() => {
        prefetchRoute('/cart');
      }, 2000);
    }

    // Prefetch checkout when on cart
    if (window.location.pathname === '/cart') {
      setTimeout(() => {
        prefetchRoute('/checkout');
      }, 1000);
    }
  }, []); // Empty deps - run once only
}
