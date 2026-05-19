import { create } from 'zustand';
import type { Product } from '../../../shared/src/index';
import { productsApi, adminProductsApi } from '../lib/api';

interface ProductsState {
  products: Product[];
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  cacheExpiry: number; // 5 minutes in ms
}

interface ProductsActions {
  // Public products
  fetchProducts: (params?: { search?: string }) => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  
  // Admin products
  fetchAdminProducts: () => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Setters
  setProducts: (products: Product[]) => void;
  setProduct: (product: Product | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type ProductsStore = ProductsState & ProductsActions;

export const useProductsStore = create<ProductsStore>((set, get) => ({
  // State
  products: [],
  product: null,
  isLoading: false,
  error: null,
  lastFetch: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes

// Public products
  fetchProducts: async (params) => {
      const now = Date.now();
      const state = get();
      
      // Cache hit - return cached data without fetching
      if (state.products.length > 0 && state.lastFetch && 
          (now - state.lastFetch) < state.cacheExpiry) {
        return;
      }
      
      set({ isLoading: true, error: null });
      try {
        const products = await productsApi.list();
let filtered = products || [];
        if (params?.search) {
          filtered = products.filter(p => 
            p.name.toLowerCase().includes(params.search!.toLowerCase()) ||
            p.description?.toLowerCase().includes(params.search!.toLowerCase())
          );
        }
        set({ products: filtered, lastFetch: Date.now() });
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to fetch products';
       set({ error: message, products: [] });
     } finally {
       set({ isLoading: false });
     }
   },

   fetchProduct: async (id) => {
     set({ isLoading: true, error: null });
     try {
       const product = await productsApi.get(id);
       set({ product });
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to fetch product';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

    // Admin products
    fetchAdminProducts: async () => {
      set({ isLoading: true, error: null });
      try {
        const products = await adminProductsApi.list();
        set({ products });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch admin products';
        set({ error: message });
      } finally {
        set({ isLoading: false });
      }
    },

   createProduct: async (data) => {
      set({ isLoading: true, error: null });
      try {
        await adminProductsApi.create(data);
        await get().fetchAdminProducts();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create product';
        set({ error: message });
        throw error; // ← re-lanza para que el componente lo capture
      } finally {
        set({ isLoading: false });
      }
    },

    updateProduct: async (id, data) => {
      set({ isLoading: true, error: null });
      try {
        await adminProductsApi.update(id, data);
        await get().fetchAdminProducts();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update product';
        set({ error: message });
        throw error; // ← re-lanza
      } finally {
        set({ isLoading: false });
      }
    },

   deleteProduct: async (id) => {
     set({ isLoading: true, error: null });
     try {
       await adminProductsApi.delete(id);
       await get().fetchAdminProducts();
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to delete product';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

  setProducts: (products) => set({ products }),
  setProduct: (product) => set({ product }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// Selectors
export const useProducts = () => useProductsStore((state) => state.products);
export const useProduct = (id: string) => {
  const product = useProductsStore((state) => state.product);
  const fetchProduct = useProductsStore((state) => state.fetchProduct);
  const isLoading = useProductsStore((state) => state.isLoading);
  
  // Fetch product when id changes - must be in useEffect, not render body
  // Use a stable reference to avoid stale closure
  const fetchProductRef = useProductsStore.getState().fetchProduct;
  
  // Use useEffect pattern at component level instead
  return { product, isLoading, fetchProduct: fetchProductRef };
};
export const useProductsLoading = () => useProductsStore((state) => state.isLoading);
export const useProductsError = () => useProductsStore((state) => state.error);