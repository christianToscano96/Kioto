import axios from 'axios';
import type { User, Product, Cart, CartItem, Order, Category, Settings } from '../../../shared/src/index';

// Get base URL without /api for socket.io
const getBaseUrl = () => {
  const apiUrl = import.meta.env?.VITE_API_URL ?? 'http://localhost:4000/api';
  return apiUrl.replace('/api', '');
};

// Create axios instance with credentials
export const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

// Add response interceptor for auth errors - only redirect for protected routes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for public routes
    const isPublicRoute = window.location.pathname.startsWith('/login') || 
                          window.location.pathname.startsWith('/register') ||
                          window.location.pathname === '/' ||
                          window.location.pathname.startsWith('/products') ||
                          window.location.pathname.startsWith('/cart') ||
                          window.location.pathname.startsWith('/checkout');
    
    if (error.response?.status === 401 && !isPublicRoute) {
      // Clear auth state on unauthorized - only for admin routes
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post<{ user: User; refreshToken: string }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; refreshToken: string }>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  me: () => api.get<{ user: User }>('/auth/me'),
};

// Products API (public - for storefront)
export const productsApi = {
  list: async () => {
    const res = await api.get<{ products: Product[]; pagination: unknown }>('/public/products');
    return res.data.products || [];
  },

  get: async (id: string) => {
    const res = await api.get<{ product: Product }>(`/public/products/${id}`);
    return res.data.product;
  },

  getBySlug: (slug: string) =>
    api.get<{ product: Product }>(`/public/products/slug/${slug}`).then(res => res.data.product),

  search: async (query: string) => {
    const res = await api.get<{ products: Product[] }>('/public/products', { params: { search: query } });
    return res.data.products || [];
  },

  getColors: async () => {
    const res = await api.get<{ colors: string[] }>('/public/colors');
    return res.data.colors || [];
  },
};

// Admin Products API
export const adminProductsApi = {
  list: (params?: { limit?: number; skip?: number; published?: boolean; category?: string }) =>
    api.get<{ products: Product[] }>('/products', { params }).then(res => res.data.products),

  get: (id: string) =>
    api.get<{ product: Product }>(`/products/${id}`).then(res => res.data.product),

  create: (data: Partial<Product>) =>
    api.post<{ product: Product }>('/products', data).then(res => res.data.product),

  update: (id: string, data: Partial<Product>) =>
    api.put<{ product: Product }>(`/products/${id}`, data).then(res => res.data.product),

  delete: (id: string) =>
    api.delete(`/products/${id}`),
};

// Admin Categories API
export const adminCategoriesApi = {
  list: () =>
    api.get<{ categories: Category[] }>('/categories').then(res => res.data),

  listPublic: () =>
    api.get<Category[]>('/categories/public').then(res => ({ categories: res.data })),

  get: (id: string) =>
    api.get<{ category: Category }>(`/categories/${id}`).then(res => res.data.category),

  create: (data: Partial<Category>) =>
    api.post<{ category: Category }>('/categories', data).then(res => res.data.category),

  createPublic: (data: Partial<Category>) =>
    api.post<Category>('/categories/public', data).then(res => res.data),

  update: (id: string, data: Partial<Category>) =>
    api.put<{ category: Category }>(`/categories/${id}`, data).then(res => res.data.category),

  updatePublic: (id: string, data: Partial<Category>) =>
    api.put<Product>(`/categories/public/${id}`, data).then(res => res.data),

  delete: (id: string) =>
    api.delete(`/categories/${id}`),

  deletePublic: (id: string) =>
    api.delete(`/categories/public/${id}`),
};

// Cart API
export const cartApi = {
  get: () => api.get<{ cart: Cart }>('/cart'),

  addItem: (data: { productId: string; quantity: number; size?: string; color?: string }) =>
    api.post<{ cart: Cart }>('/cart/items', data),

  updateItem: (itemId: string, quantity: number) =>
    api.put<{ cart: Cart }>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) =>
    api.delete<{ cart: Cart }>(`/cart/items/${itemId}`),

  clear: () => api.delete('/cart'),

  getStats: () => 
    api.get<{ totalCarts: number; abandonedCarts: number; convertedCarts: number; conversionRate: string }>('/cart/stats'),
};

// Checkout API
export const checkoutApi = {
  createSession: (data: { items: CartItem[] }) =>
    api.post<{ url: string }>('/checkout', data),
};

export const ordersApi = {
  list: (params?: { days?: number; from?: string; to?: string; limit?: number; page?: number }) =>
    api.get<Order[]>('/orders', { params }).then(res => res.data),

  get: (id: string) =>
    api.get<Order>(`/orders/${id}`).then(res => res.data),

  updateStatus: (id: string, status: string) =>
    api.patch<Order>(`/orders/${id}/status`, { status }).then(res => res.data),

  createManual: (data: { customerEmail: string; customerName: string; items: { productId: string; quantity: number }[] }) =>
    api.post<Order>('/orders/manual', data).then(res => res.data),
};

// Settings API
export const settingsApi = {
  get: () =>
    api.get<Settings>('/settings'),

  update: (settings: Settings) =>
    api.put<{ settings: Settings }>('/settings', { settings }),
};

// Profile API
export const profileApi = {
  update: (data: { name?: string; email?: string }) =>
    api.put<{ user: User }>('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};