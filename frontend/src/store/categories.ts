import { create } from 'zustand';
import type { Category } from '../../../shared/src/index';
import { adminCategoriesApi } from '../lib/api';

const CATEGORIES_CACHE_KEY = 'kioto:categories:v1';

function loadCachedCategories(): { categories: Category[]; lastFetch: number | null } {
  if (typeof sessionStorage === 'undefined') {
    return { categories: [], lastFetch: null };
  }

  try {
    const parsed = JSON.parse(sessionStorage.getItem(CATEGORIES_CACHE_KEY) || 'null') as {
      categories?: Category[];
      lastFetch?: number;
    } | null;

    if (parsed?.categories?.length && parsed.lastFetch) {
      return { categories: parsed.categories, lastFetch: parsed.lastFetch };
    }
  } catch {
    // Ignore invalid cache payloads.
  }

  return { categories: [], lastFetch: null };
}

function saveCachedCategories(categories: Category[], lastFetch: number) {
  try {
    sessionStorage.setItem(
      CATEGORIES_CACHE_KEY,
      JSON.stringify({ categories, lastFetch }),
    );
  } catch {
    // sessionStorage may be unavailable or full.
  }
}

interface CategoriesState {
  categories: Category[];
  isLoadingList: boolean;
  isRefreshingList: boolean;
  isLoadingAdmin: boolean;
  error: string | null;
  lastFetch: number | null;
  cacheExpiry: number;
}

interface CategoriesActions {
  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setCategories: (categories: Category[]) => void;
  setError: (error: string | null) => void;
}

type CategoriesStore = CategoriesState & CategoriesActions;

const cachedCategories = loadCachedCategories();
let categoriesListInflight: Promise<void> | null = null;

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: cachedCategories.categories,
  isLoadingList: false,
  isRefreshingList: false,
  isLoadingAdmin: false,
  error: null,
  lastFetch: cachedCategories.lastFetch,
  cacheExpiry: 5 * 60 * 1000,

  fetchCategories: async () => {
    const state = get();
    const now = Date.now();
    const hasCategories = state.categories.length > 0;
    const cacheValid =
      hasCategories &&
      state.lastFetch !== null &&
      now - state.lastFetch < state.cacheExpiry;

    if (cacheValid) {
      return;
    }

    if (categoriesListInflight) {
      return categoriesListInflight;
    }

    const isBackgroundRefresh = hasCategories;

    set({
      isLoadingList: !isBackgroundRefresh,
      isRefreshingList: isBackgroundRefresh,
      error: null,
    });

    categoriesListInflight = (async () => {
      try {
        const response = await adminCategoriesApi.listPublic();
        const lastFetch = Date.now();
        set({ categories: response.categories, lastFetch });
        saveCachedCategories(response.categories, lastFetch);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch categories';
        if (!isBackgroundRefresh) {
          set({ error: message });
        }
      } finally {
        set({ isLoadingList: false, isRefreshingList: false });
        categoriesListInflight = null;
      }
    })();

    return categoriesListInflight;
  },

  createCategory: async (data) => {
    set({ isLoadingAdmin: true, error: null });
    try {
      await adminCategoriesApi.create(data);
      set({ lastFetch: null });
      await get().fetchCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      set({ error: message });
    } finally {
      set({ isLoadingAdmin: false });
    }
  },

  updateCategory: async (id, data) => {
    set({ isLoadingAdmin: true, error: null });
    try {
      await adminCategoriesApi.update(id, data);
      set({ lastFetch: null });
      await get().fetchCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      set({ error: message });
    } finally {
      set({ isLoadingAdmin: false });
    }
  },

  deleteCategory: async (id) => {
    set({ isLoadingAdmin: true, error: null });
    try {
      await adminCategoriesApi.delete(id);
      set({ lastFetch: null });
      await get().fetchCategories();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      set({ error: message });
    } finally {
      set({ isLoadingAdmin: false });
    }
  },

  setCategories: (categories) => set({ categories }),
  setError: (error) => set({ error }),
}));
