import { create } from 'zustand';
import type { Category } from '../../../shared/src/index';
import { adminCategoriesApi } from '../lib/api';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  cacheExpiry: number; // 5 minutes in ms
}

interface CategoriesActions {
  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type CategoriesStore = CategoriesState & CategoriesActions;

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  // State
  categories: [],
  isLoading: false,
  error: null,
  lastFetch: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes

  // Fetch all categories
  fetchCategories: async () => {
      const now = Date.now();
      const state = get();
      
      // Cache hit - return cached data without fetching
      if (state.categories.length > 0 && state.lastFetch && 
          (now - state.lastFetch) < state.cacheExpiry) {
        return;
      }
      
      set({ isLoading: true, error: null });
     try {
       // Public pages must not probe the admin-only endpoint first.
       const response = await adminCategoriesApi.listPublic();
       set({ categories: response.categories, lastFetch: Date.now() });
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to fetch categories';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

createCategory: async (data) => {
     set({ isLoading: true, error: null });
     try {
       await adminCategoriesApi.create(data);
       set({ lastFetch: null });
       await get().fetchCategories();
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to create category';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

updateCategory: async (id, data) => {
     set({ isLoading: true, error: null });
     try {
       await adminCategoriesApi.update(id, data);
       set({ lastFetch: null });
       await get().fetchCategories();
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to update category';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

deleteCategory: async (id) => {
     set({ isLoading: true, error: null });
     try {
       await adminCategoriesApi.delete(id);
       set({ lastFetch: null });
       await get().fetchCategories();
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to delete category';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

  setCategories: (categories) => set({ categories }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));