import { getApiOrigin } from '@/lib/api';
import { useCategoriesStore } from '@/store/categories';
import { useProductsStore } from '@/store/products';

let bootstrapStarted = false;

export function bootstrapStorefrontData() {
  if (bootstrapStarted || typeof window === 'undefined') {
    return;
  }

  bootstrapStarted = true;

  const apiOrigin = getApiOrigin();
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), 5000);

  void fetch(`${apiOrigin}/health`, {
    method: 'GET',
    credentials: 'omit',
    signal: controller.signal,
  }).catch(() => {
    // Waking the backend is best-effort; catalog fetch continues in parallel.
  });

  void useProductsStore.getState().fetchProducts();
  void useCategoriesStore.getState().fetchCategories();
}
