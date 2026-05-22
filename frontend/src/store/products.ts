import { create } from 'zustand';
import type { Product } from '../../../shared/src/index';
import { productsApi, adminProductsApi } from '../lib/api';

const PRODUCTS_CACHE_KEY = 'kioto:products:v1';

function loadCachedProducts(): { products: Product[]; lastFetch: number | null } {
  if (typeof sessionStorage === 'undefined') {
    return { products: [], lastFetch: null };
  }

  try {
    const parsed = JSON.parse(sessionStorage.getItem(PRODUCTS_CACHE_KEY) || 'null') as {
      products?: Product[];
      lastFetch?: number;
    } | null;

    if (parsed?.products?.length && parsed.lastFetch) {
      return { products: parsed.products, lastFetch: parsed.lastFetch };
    }
  } catch {
    // Ignore invalid cache payloads.
  }

  return { products: [], lastFetch: null };
}

function saveCachedProducts(products: Product[], lastFetch: number) {
  try {
    sessionStorage.setItem(
      PRODUCTS_CACHE_KEY,
      JSON.stringify({ products, lastFetch }),
    );
  } catch {
    // sessionStorage may be unavailable or full.
  }
}

interface ProductsState {
  products: Product[];
  product: Product | null;
  isLoadingList: boolean;
  isRefreshingList: boolean;
  isLoadingDetail: boolean;
  isLoadingAdmin: boolean;
  error: string | null;
  lastFetch: number | null;
  cacheExpiry: number;
}

interface ProductsActions {
  fetchProducts: (params?: { search?: string }) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  fetchAdminProducts: () => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setProducts: (products: Product[]) => void;
  setProduct: (product: Product | null) => void;
  setError: (error: string | null) => void;
}

type ProductsStore = ProductsState & ProductsActions;

const cachedProducts = loadCachedProducts();
let productsListInflight: Promise<void> | null = null;

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: cachedProducts.products,
  product: null,
  isLoadingList: false,
  isRefreshingList: false,
  isLoadingDetail: false,
  isLoadingAdmin: false,
  error: null,
  lastFetch: cachedProducts.lastFetch,
  cacheExpiry: 5 * 60 * 1000,

  fetchProducts: async (params) => {
    const state = get();
    const now = Date.now();
    const hasProducts = state.products.length > 0;
    const cacheValid =
      hasProducts &&
      state.lastFetch !== null &&
      now - state.lastFetch < state.cacheExpiry;

    if (cacheValid) {
      return;
    }

    if (productsListInflight) {
      return productsListInflight;
    }

    const isBackgroundRefresh = hasProducts;

    set({
      isLoadingList: !isBackgroundRefresh,
      isRefreshingList: isBackgroundRefresh,
      error: null,
    });

    productsListInflight = (async () => {
      try {
        const products = await productsApi.list();
        let filtered = products || [];
        if (params?.search) {
          const query = params.search.toLowerCase();
          filtered = products.filter(
            (product) =>
              product.name.toLowerCase().includes(query) ||
              product.description?.toLowerCase().includes(query),
          );
        }

        const lastFetch = Date.now();
        set({ products: filtered, lastFetch });
        saveCachedProducts(filtered, lastFetch);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch products';
        if (!isBackgroundRefresh) {
          set({ error: message });
        }
      } finally {
        set({ isLoadingList: false, isRefreshingList: false });
        productsListInflight = null;
      }
    })();

    return productsListInflight;
  },

  fetchProduct: async (id) => {
    set({ isLoadingDetail: true, error: null });
    try {
      const product = await productsApi.get(id);
      set({ product });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch product';
      set({ error: message });
    } finally {
      set({ isLoadingDetail: false });
    }
  },

  fetchAdminProducts: async () => {
    set({ isLoadingAdmin: true, error: null });
    try {
      const products = await adminProductsApi.list();
      set({ products });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch admin products';
      set({ error: message });
    } finally {
      set({ isLoadingAdmin: false });
    }
  },

  createProduct: async (data) => {
    set({ isLoadingAdmin: true, error: null });
    try {
      await adminProductsApi.create(data);
      set({ lastFetch: null });
      try {
        sessionStorage.removeItem(PRODUCTS_CACHE_KEY);
      } catch {
        // Ignore storage errors.
      }
      await get().fetchAdminProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product';
      set({ error: message });
    } finally {
      set({ isLoadingAdmin: false });
    }
  },

  updateProduct: async (id, data) => {
    set({ isLoadingAdmin: true, error: null });
    try {
      await adminProductsApi.update(id, data);
      set({ lastFetch: null });
      try {
        sessionStorage.removeItem(PRODUCTS_CACHE_KEY);
      } catch {
        // Ignore storage errors.
      }
      await get().fetchAdminProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product';
      set({ error: message });
    } finally {
      set({ isLoadingAdmin: false });
    }
  },

  deleteProduct: async (id) => {
    set({ isLoadingAdmin: true, error: null });
    try {
      await adminProductsApi.delete(id);
      set({ lastFetch: null });
      try {
        sessionStorage.removeItem(PRODUCTS_CACHE_KEY);
      } catch {
        // Ignore storage errors.
      }
      await get().fetchAdminProducts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product';
      set({ error: message });
    } finally {
      set({ isLoadingAdmin: false });
    }
  },

  setProducts: (products) => set({ products }),
  setProduct: (product) => set({ product }),
  setError: (error) => set({ error }),
}));

export const useProducts = () => useProductsStore((state) => state.products);

export const useProduct = (id: string) => {
  const product = useProductsStore((state) => state.product);
  const isLoadingDetail = useProductsStore((state) => state.isLoadingDetail);
  const fetchProductRef = useProductsStore.getState().fetchProduct;

  return { product, isLoading: isLoadingDetail, fetchProduct: fetchProductRef, id };
};

export const useProductsInitialLoading = () =>
  useProductsStore((state) => state.isLoadingList);

export const useProductsRefreshing = () =>
  useProductsStore((state) => state.isRefreshingList);

export const useProductsLoading = () =>
  useProductsStore((state) => state.isLoadingList);

export const useProductsAdminLoading = () =>
  useProductsStore((state) => state.isLoadingAdmin);

export const useProductsError = () => useProductsStore((state) => state.error);
