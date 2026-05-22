import { create } from 'zustand';
import type { Order } from '../../../shared/src/index';
import { ordersApi } from '../lib/api';

interface OrdersState {
  orders: Order[];
  order: Order | null;
  isLoading: boolean;
  error: string | null;
}

interface OrdersActions {
  fetchOrders: () => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  createManualOrder: (data: { customerEmail: string; customerName: string; items: any[] }) => Promise<void>;
  setOrders: (orders: Order[]) => void;
  setOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type OrdersStore = OrdersState & OrdersActions;

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  // State
  orders: [],
  order: null,
  isLoading: false,
  error: null,

fetchOrders: async () => {
     set({ isLoading: true, error: null });
     try {
       const orders = await ordersApi.list();
       set({ orders });
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to fetch orders';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

   fetchOrder: async (id) => {
     set({ isLoading: true, error: null });
     try {
       const order = await ordersApi.get(id);
       set({ order });
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to fetch order';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

   updateOrderStatus: async (id, status) => {
     set({ isLoading: true, error: null });
     try {
       await ordersApi.updateStatus(id, status);
       await get().fetchOrders();
       if (get().order?._id === id) {
         await get().fetchOrder(id);
       }
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to update order status';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

   createManualOrder: async (data: { customerEmail: string; customerName: string; items: any[] }) => {
     set({ isLoading: true, error: null });
     try {
       await ordersApi.createManual(data);
       await get().fetchOrders();
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to create manual order';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

  setOrders: (orders) => set({ orders }),
  setOrder: (order) => set({ order }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

// Selectors
export const useOrders = () => useOrdersStore((state) => state.orders);
export const useOrdersLoading = () => useOrdersStore((state) => state.isLoading);
export const useOrdersError = () => useOrdersStore((state) => state.error);