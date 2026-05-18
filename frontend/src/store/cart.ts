import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../../../shared/src/index';
import { cartApi } from '../lib/api';

interface CartState {
  items: CartItem[];
  sessionId: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
}

interface CartActions {
  // Async actions
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity: number, size?: string, color?: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Local actions (immediate state updates)
  addItem: (item: CartItem) => void;
  updateItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  setSessionId: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      sessionId: null,
      isLoading: false,
      isSyncing: false,
      error: null,

// Async actions with optimistic updates
fetchCart: async () => {
          set({ isLoading: true, error: null });
           try {
             const response = await cartApi.get();
             const items = response.data.cart?.items || [];
             const sessionId = response.data.cart?.sessionId || null;
             set({ items, sessionId });
           } catch (error) {
             const message = error instanceof Error ? error.message : 'Failed to fetch cart';
             set({ error: message });
           } finally {
             set({ isLoading: false });
           }
         },

addToCart: async (product: Product, quantity: number, size?: string, color?: string) => {
             set({ isSyncing: true, error: null });
             // Use empty string for size/color if not provided (backend requires strings)
             const sizeValue = size ?? "";
             const colorValue = color ?? "";
             const optimisticItem: CartItem = {
               productId: product._id,
               quantity,
               price: product.price,
               size: sizeValue,
               color: colorValue,
             };
             // Optimistic update
             get().addItem(optimisticItem);
            
            try {
              // Backend returns the updated cart - use it instead of fetching again
              const response = await cartApi.addItem({ productId: product._id, quantity, size: sizeValue, color: colorValue });
              const items = response.data.cart?.items || [];
              const sessionId = response.data.cart?.sessionId || null;
              // Update with backend response (avoids race condition)
              set({ items, sessionId });
            } catch (error: any) {
              // Rollback optimistic update with exact match (size + color)
              set((state) => ({
                items: state.items.filter(
                  (item) => 
                    !(item.productId === product._id && 
                      item.size === sizeValue && 
                      item.color === colorValue)
                ),
              }));
              const message = error instanceof Error ? error.message : 'Failed to add item';
              set({ error: message });
              throw error;
            } finally {
              set({ isSyncing: false });
            }
          },

      updateCartItem: async (itemId, quantity) => {
          set({ isSyncing: true, error: null });
          const items = get().items.map(item => 
            (item as any)._id === itemId ? { ...item, quantity } : item
          );
          set({ items });
          
          try {
            await cartApi.updateItem(itemId, quantity);
          } catch (error) {
            await get().fetchCart();
            const message = error instanceof Error ? error.message : 'Failed to update cart';
            set({ error: message });
          } finally {
            set({ isSyncing: false });
          }
        },

removeCartItem: async (itemId) => {
        set({ isSyncing: true, error: null });
        const previousItems = get().items;
        set({ items: previousItems.filter(item => (item as any)._id !== itemId) });
        
        try {
          await cartApi.removeItem(itemId);
        } catch (error) {
          set({ items: previousItems });
          const message = error instanceof Error ? error.message : 'Failed to remove item';
          set({ error: message });
        } finally {
          set({ isSyncing: false });
        }
      },

clearCart: async () => {
          set({ isSyncing: true, error: null });
          const previousItems = get().items;
          set({ items: [] });
          
          try {
            await cartApi.clear();
          } catch (error) {
            set({ items: previousItems });
            const message = error instanceof Error ? error.message : 'Failed to clear cart';
            set({ error: message });
          } finally {
            set({ isSyncing: false });
          }
        },

// Local actions
       addItem: (item) =>
         set((state) => {
           const existingIndex = state.items.findIndex(
             (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
           );

           if (existingIndex >= 0) {
             const newItems = [...state.items];
             newItems[existingIndex] = {
               ...newItems[existingIndex],
               quantity: newItems[existingIndex].quantity + item.quantity,
             };
             return { items: newItems };
           }

           return { items: [...state.items, item] };
         }),

      updateItem: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        })),

removeItem: (productId, size?: string, color?: string) =>
         set((state) => ({
           items: state.items.filter((item) => 
             item.productId !== productId || 
             (size && item.size !== size) || 
             (color && item.color !== color)
           ),
         })),

      clear: () => set({ items: [] }),

      setSessionId: (sessionId) => set({ sessionId }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        sessionId: state.sessionId,
      }),
    }
  )
);

// Computed selectors
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartTotal = () =>
  useCartStore((state) =>
    state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  );
export const useCartItemCount = () =>
  useCartStore((state) => state.items.reduce((count, item) => count + item.quantity, 0));
export const useCartSessionId = () => useCartStore((state) => state.sessionId);
export const useCartIsLoading = () => useCartStore((state) => state.isLoading);
export const useCartIsSyncing = () => useCartStore((state) => state.isSyncing);
export const useCartError = () => useCartStore((state) => state.error);